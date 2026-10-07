import {
  blo,
  calibrate,
  libraries,
  measureSample,
  SAMPLE_TARGET_MS,
  samplePlan,
  wasm,
} from "/libraries.mjs";
import { addresses, addressSequence } from "/wasm/fixtures.mjs";
import { median } from "/wasm/measure.mjs";

const element = (id) => document.getElementById(id);
const status = element("status");
const results = new Map();
const rows = new Map();
let implementations;
let controller;
let startupMs;
const example = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const bloNames = ["blo", "blo/wasm"];

function busy(running) {
  for (const button of document.querySelectorAll(".run")) button.disabled = running;
  element("run-all").disabled = running || !implementations;
  element("stop").disabled = !running;
  element("iterations").disabled = running;
  element("samples").disabled = running;
  element("download").disabled = running || results.size === 0;
}

function showResults() {
  const best = Math.max(0, ...Array.from(results.values(), (result) => result.ops));
  for (const [name, row] of rows) {
    const result = results.get(name);
    row.querySelector(".result").textContent = result
      ? Math.round(result.ops).toLocaleString()
      : "-";
    const score = best && result ? result.ops / best : 0;
    const bar = row.querySelector(".bar");
    bar.style.width = `${score * 100}px`;
    bar.style.background = `hsl(${Math.round(score * 120)}, 50%, 70%)`;
  }
}

async function run(names) {
  if (controller) return;
  const current = controller = new AbortController();
  const signal = current.signal;
  const iterations = Number(element("iterations").value);
  const samples = Number(element("samples").value);
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  const nextAddresses = addressSequence(seed);
  const plans = new Map();
  const timings = new Map(names.map((name) => [name, []]));
  const checksums = new Map(names.map((name) => [name, []]));
  for (const name of names) results.delete(name);
  showResults();
  busy(true);
  try {
    for (const name of names) {
      status.textContent = `Warming up ${name}…`;
      const ns = await calibrate(
        implementations[name],
        nextAddresses,
        signal,
        (uri) => {
          rows.get(name).querySelector(".live").src = uri;
        },
      );
      plans.set(name, samplePlan(ns, iterations));
    }
    const comparedBloNames = bloNames.filter((name) => plans.has(name));
    // Match call counts across Blo implementations so their checksums remain
    // comparable. Slower canvas libraries retain their own shorter call counts.
    const bloCalls = Math.max(
      0,
      ...comparedBloNames.map((name) => plans.get(name).count),
    );
    for (const name of comparedBloNames) plans.get(name).count = bloCalls;
    for (let i = 0; i < samples; i++) {
      const corpus = nextAddresses(
        Math.max(...Array.from(plans.values(), (plan) => plan.count)),
      );
      for (const name of (i % 2 ? [...names].reverse() : names)) {
        const { count, batchSize } = plans.get(name);
        status.textContent = `${name}: sample ${
          i + 1
        } / ${samples} (${count.toLocaleString()} calls)`;
        const result = await measureSample(
          implementations[name],
          corpus.slice(0, count),
          signal,
          {
            batchSize,
            preview: (uri) => {
              rows.get(name).querySelector(".live").src = uri;
            },
          },
        );
        if (result.ns <= 0) {
          throw new Error("Browser timer is too coarse to measure this library");
        }
        timings.get(name).push(result.ns);
        checksums.get(name).push(result.sum);
        const ns = median(timings.get(name));
        rows.get(name).querySelector(".result").textContent = Math.round(1e9 / ns)
          .toLocaleString();
      }
      for (const name of comparedBloNames.slice(1)) {
        if (checksums.get(comparedBloNames[0])[i] !== checksums.get(name)[i]) {
          throw new Error(
            `${comparedBloNames[0]} and ${name} output checksums differ`,
          );
        }
      }
    }
    for (const name of names) {
      const ns = median(timings.get(name));
      results.set(name, {
        name,
        ns,
        ops: 1e9 / ns,
        samplesNs: timings.get(name),
        checksums: checksums.get(name),
        iterations: plans.get(name).count,
        minimumIterations: iterations,
        batchSize: plans.get(name).batchSize,
        samples,
        date: new Date().toISOString(),
      });
    }
    showResults();
    status.textContent =
      `Done. Median of ${samples} samples; call counts calibrated to target ${SAMPLE_TARGET_MS} ms of generation per sample.`;
  } catch (error) {
    showResults();
    status.textContent = signal.aborted
      ? "Stopped. Incomplete results discarded."
      : `Benchmark failed: ${error.message}`;
  } finally {
    controller = undefined;
    busy(false);
  }
}

function addRow(name, fn) {
  const row = document.createElement("tr");
  row.dataset.library = name;
  row.innerHTML =
    "<td class=\"score\"><div class=\"bar\"></div></td><td class=\"name\"></td><td class=\"result\">-</td><td><button class=\"run\" disabled>Run</button></td><td><div class=\"render-zone\"><div><img class=\"live\" alt=\"\"></div><div><img class=\"example\" alt=\"\"></div></div></td>";
  row.querySelector(".name").textContent = name;
  const image = fn(example);
  row.querySelector(".live").src = image;
  row.querySelector(".example").src = image;
  row.querySelector(".live").alt = `${name} benchmark icon`;
  row.querySelector(".example").alt = `${name} sample icon`;
  row.querySelector(".run").addEventListener("click", () => run([name]));
  rows.set(name, row);
  element("benchmarks").append(row);
}

element("run-all").addEventListener(
  "click",
  () => run(Object.keys(implementations)),
);
element("stop").addEventListener("click", () => controller?.abort());
element("download").addEventListener("click", () => {
  const report = {
    runtime: navigator.userAgent,
    startupMs,
    nativeBase64Available: typeof Uint8Array.prototype.toBase64 === "function",
    sampleTargetMs: SAMPLE_TARGET_MS,
    metric: "data URI generations per second; DOM/React rendering excluded",
    cachePolicy: "fresh corpus each run, unique timed addresses, separate warmup",
    results: Array.from(results.values()),
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
  implementations = {
    blo,
    "blo/wasm": wasm.blo,
    ...libraries,
  };
  for (const [name, fn] of Object.entries(implementations)) addRow(name, fn);
  busy(false);
  status.textContent = "Ready. blo and blo/wasm match for 256 addresses.";
} catch (error) {
  status.textContent = error.message;
}
