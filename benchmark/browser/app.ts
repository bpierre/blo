import {
  blo,
  calibrate,
  libraries,
  measureSample,
  SAMPLE_TARGET_MS,
  samplePlan,
  wasm,
} from "/libraries.js";
import { addresses, addressSequence } from "/wasm/fixtures.js";
import { median } from "/wasm/measure.js";

import type { Address } from "blo";

interface Result {
  name: string;
  ns: number;
  ops: number;
  samplesNs: number[];
  checksums: number[];
  iterations: number;
  minimumIterations: number;
  batchSize: number;
  samples: number;
  date: string;
}
interface Benchmark {
  name: string;
  generate: (address: Address) => string;
  view: {
    result: HTMLTableCellElement;
    bar: HTMLDivElement;
    live: HTMLImageElement;
    button: HTMLButtonElement;
  };
  result?: Result;
}
interface Run {
  benchmark: Benchmark;
  plan: ReturnType<typeof samplePlan>;
  timings: number[];
  checksums: number[];
}

function element<T extends HTMLElement>(
  selector: string,
  constructor: { new(): T },
  parent: ParentNode = document,
): T {
  const node = parent.querySelector(selector);
  if (!(node instanceof constructor)) {
    throw new Error(`Missing or invalid benchmark element: ${selector}`);
  }
  return node;
}
const status = element("#status", HTMLParagraphElement);
const runAll = element("#run-all", HTMLButtonElement);
const stop = element("#stop", HTMLButtonElement);
const download = element("#download", HTMLButtonElement);
const iterationSelect = element("#iterations", HTMLSelectElement);
const sampleSelect = element("#samples", HTMLSelectElement);
const tableBody = element("#benchmarks", HTMLTableSectionElement);
const benchmarks: Benchmark[] = [];
let controller: AbortController | undefined;
let startupMs: number | undefined;
const example = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const bloNames = ["blo", "blo/wasm"];

function busy(running: boolean) {
  for (const benchmark of benchmarks) {
    benchmark.view.button.disabled = running;
  }
  runAll.disabled = running || benchmarks.length === 0;
  stop.disabled = !running;
  iterationSelect.disabled = running;
  sampleSelect.disabled = running;
  download.disabled = running || !benchmarks.some((benchmark) => benchmark.result);
}

function showResults() {
  const best = Math.max(
    0,
    ...benchmarks.map((benchmark) => benchmark.result?.ops ?? 0),
  );
  for (const { result, view } of benchmarks) {
    view.result.textContent = result
      ? Math.round(result.ops).toLocaleString()
      : "-";
    const score = best && result ? result.ops / best : 0;
    const bar = view.bar;
    bar.style.width = `${score * 100}px`;
    bar.style.background = `hsl(${Math.round(score * 120)}, 50%, 70%)`;
  }
}

async function run(selected: readonly Benchmark[]) {
  if (controller || selected.length === 0) return;
  const current = controller = new AbortController();
  const signal = current.signal;
  const iterations = Number(iterationSelect.value);
  const samples = Number(sampleSelect.value);
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  const nextAddresses = addressSequence(seed);
  const runs: Run[] = [];
  for (const benchmark of selected) benchmark.result = undefined;
  showResults();
  busy(true);
  try {
    for (const benchmark of selected) {
      const { name, generate, view } = benchmark;
      status.textContent = `Warming up ${name}…`;
      const ns = await calibrate(
        generate,
        nextAddresses,
        signal,
        (uri) => {
          view.live.src = uri;
        },
      );
      runs.push({
        benchmark,
        plan: samplePlan(ns, iterations),
        timings: [],
        checksums: [],
      });
    }
    const comparedBlo = runs.filter(({ benchmark }) =>
      bloNames.includes(benchmark.name)
    );
    // Match call counts across Blo implementations so their checksums remain
    // comparable. Slower canvas libraries retain their own shorter call counts.
    const bloCalls = Math.max(
      0,
      ...comparedBlo.map(({ plan }) => plan.count),
    );
    for (const { plan } of comparedBlo) plan.count = bloCalls;
    for (let i = 0; i < samples; i++) {
      const corpus = nextAddresses(
        Math.max(...runs.map(({ plan }) => plan.count)),
      );
      for (
        const { benchmark, plan, timings, checksums }
          of (i % 2 ? [...runs].reverse() : runs)
      ) {
        const { name, generate, view } = benchmark;
        const { count, batchSize } = plan;
        status.textContent = `${name}: sample ${
          i + 1
        } / ${samples} (${count.toLocaleString()} calls)`;
        const result = await measureSample(
          generate,
          corpus.slice(0, count),
          signal,
          {
            batchSize,
            preview: (uri) => {
              view.live.src = uri;
            },
          },
        );
        if (result.ns <= 0) {
          throw new Error("Browser timer is too coarse to measure this library");
        }
        timings.push(result.ns);
        checksums.push(result.sum);
        const ns = median(timings);
        view.result.textContent = Math.round(1e9 / ns)
          .toLocaleString();
      }
      const [firstBlo, ...otherBlo] = comparedBlo;
      if (firstBlo) {
        for (const other of otherBlo) {
          if (firstBlo.checksums[i] !== other.checksums[i]) {
            throw new Error(
              `${firstBlo.benchmark.name} and ${other.benchmark.name} output checksums differ`,
            );
          }
        }
      }
    }
    for (const { benchmark, plan, timings, checksums } of runs) {
      const ns = median(timings);
      benchmark.result = {
        name: benchmark.name,
        ns,
        ops: 1e9 / ns,
        samplesNs: timings,
        checksums,
        iterations: plan.count,
        minimumIterations: iterations,
        batchSize: plan.batchSize,
        samples,
        date: new Date().toISOString(),
      };
    }
    showResults();
    status.textContent =
      `Done. Median of ${samples} samples; call counts calibrated to target ${SAMPLE_TARGET_MS} ms of generation per sample.`;
  } catch (error) {
    showResults();
    status.textContent = signal.aborted
      ? "Stopped. Incomplete results discarded."
      : `Benchmark failed: ${
        error instanceof Error ? error.message : String(error)
      }`;
  } finally {
    controller = undefined;
    busy(false);
  }
}

function createBenchmark(
  name: string,
  generate: (address: Address) => string,
): Benchmark {
  const row = document.createElement("tr");
  row.dataset.library = name;
  row.innerHTML =
    "<td class=\"score\"><div class=\"bar\"></div></td><td class=\"name\"></td><td class=\"result\">-</td><td><button class=\"run\" disabled>Run</button></td><td><div class=\"render-zone\"><div><img class=\"live\" alt=\"\"></div><div><img class=\"example\" alt=\"\"></div></div></td>";
  element(".name", HTMLTableCellElement, row).textContent = name;
  const live = element(".live", HTMLImageElement, row);
  const sample = element(".example", HTMLImageElement, row);
  const button = element(".run", HTMLButtonElement, row);
  const image = generate(example);
  live.src = sample.src = image;
  live.alt = `${name} benchmark icon`;
  sample.alt = `${name} sample icon`;
  const benchmark: Benchmark = {
    name,
    generate,
    view: {
      result: element(".result", HTMLTableCellElement, row),
      bar: element(".bar", HTMLDivElement, row),
      live,
      button,
    },
  };
  button.addEventListener(
    "click",
    () => run([benchmark]),
  );
  tableBody.append(row);
  return benchmark;
}

runAll.addEventListener(
  "click",
  () => run(benchmarks),
);
stop.addEventListener(
  "click",
  () => controller?.abort(),
);
download.addEventListener("click", () => {
  const report = {
    runtime: navigator.userAgent,
    startupMs,
    nativeBase64Available:
      typeof (Uint8Array.prototype as Uint8Array & { toBase64?: () => string })
        .toBase64 === "function",
    sampleTargetMs: SAMPLE_TARGET_MS,
    metric: "data URI generations per second; DOM/React rendering excluded",
    cachePolicy: "fresh corpus each run, unique timed addresses, separate warmup",
    results: benchmarks.flatMap(({ result }) => result ? [result] : []),
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(report, null, 2) + "\n"], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "blo-browser-benchmark.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

try {
  const start = performance.now();
  wasm.init();
  startupMs = performance.now() - start;
  for (const address of addresses(256)) {
    const expected = blo(address);
    if (expected !== wasm.blo(address)) {
      throw new Error("blo and blo/wasm outputs differ");
    }
  }
  const implementations = {
    blo,
    "blo/wasm": wasm.blo,
    ...libraries,
  };
  benchmarks.push(
    ...Object.entries(implementations).map(([name, generate]) =>
      createBenchmark(name, generate)
    ),
  );
  busy(false);
  status.textContent = "Ready. blo and blo/wasm match for 256 addresses.";
} catch (error) {
  status.textContent = error instanceof Error ? error.message : String(error);
}
