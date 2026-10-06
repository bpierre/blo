import { libraries } from "/libraries.mjs";
import { blo } from "/package/index.js";
import * as wasm from "/package/wasm.js";
import { addresses } from "/wasm/fixtures.mjs";
import { median } from "/wasm/measure.mjs";

const element = (id) => document.getElementById(id);
const status = element("status");
const results = new Map();
const rows = new Map();
let implementations;
let controller;
let startupMs;
const example = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0));

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

// Only generation and output consumption are timed. Yield between small chunks
// so Stop and preview painting work even for libraries using DOM canvases.
async function sample(fn, corpus, offset, count, signal, image) {
  let elapsed = 0;
  let sum = 0;
  let last;
  for (let i = 0; i < count;) {
    signal.throwIfAborted();
    const start = performance.now();
    const end = Math.min(count, i + 100);
    for (; i < end; i++) {
      last = fn(corpus[offset + i]);
      sum = (sum + last.length + last.charCodeAt(i % last.length)) | 0;
    }
    elapsed += performance.now() - start;
    image.src = last;
    await yieldToBrowser();
  }
  signal.throwIfAborted();
  return { ns: elapsed * 1e6 / count, sum };
}

async function run(names) {
  if (controller) return;
  const current = controller = new AbortController();
  const signal = current.signal;
  const iterations = Number(element("iterations").value);
  const samples = Number(element("samples").value);
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  // New corpus per run. Warmup addresses never appear in timed samples; all
  // libraries receive the same unique timed addresses in the same sample.
  const corpus = addresses(iterations * samples + 200, seed);
  const timings = new Map(names.map((name) => [name, []]));
  const checksums = new Map(names.map((name) => [name, []]));
  for (const name of names) results.delete(name);
  showResults();
  busy(true);
  try {
    for (const name of names) {
      status.textContent = `Warming up ${name}…`;
      await sample(
        implementations[name],
        corpus,
        0,
        200,
        signal,
        rows.get(name).querySelector(".live"),
      );
    }
    for (let i = 0; i < samples; i++) {
      for (const name of (i % 2 ? [...names].reverse() : names)) {
        status.textContent = `${name}: sample ${i + 1} / ${samples}`;
        const result = await sample(
          implementations[name],
          corpus,
          200 + i * iterations,
          iterations,
          signal,
          rows.get(name).querySelector(".live"),
        );
        timings.get(name).push(result.ns);
        checksums.get(name).push(result.sum);
        const ns = median(timings.get(name));
        rows.get(name).querySelector(".result").textContent = Math.round(1e9 / ns)
          .toLocaleString();
      }
      if (
        checksums.has("blo") && checksums.has("blo (Rust/Wasm)")
        && checksums.get("blo")[i] !== checksums.get("blo (Rust/Wasm)")[i]
      ) {
        throw new Error("Blo and Rust/Wasm output checksums differ");
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
        iterations,
        samples,
        date: new Date().toISOString(),
      });
    }
    showResults();
    status.textContent =
      `Done. Median of ${samples} samples × ${iterations.toLocaleString()} fresh addresses per library.`;
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
    if (blo(address) !== wasm.blo(address)) {
      throw new Error("Blo and Rust/Wasm outputs differ");
    }
  }
  implementations = { blo, "blo (Rust/Wasm)": wasm.blo, ...libraries };
  for (const [name, fn] of Object.entries(implementations)) addRow(name, fn);
  busy(false);
  status.textContent = "Ready. Blo and Rust/Wasm outputs match for 256 addresses.";
} catch (error) {
  status.textContent = error.message;
}
