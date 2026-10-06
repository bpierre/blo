import * as wasm from "blo/wasm";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { cpus } from "node:os";
import { performance } from "node:perf_hooks";
import { gzipSync } from "node:zlib";
import * as reference from "./dist/reference/index.js";
import { addresses } from "./fixtures.mjs";
import { measure as measureRun, median } from "./measure.mjs";

const bytes = readFileSync(new URL("dist/blo.wasm", import.meta.url));
const start = performance.now();
wasm.init();
const startupMs = performance.now() - start;
const corpus = addresses(4096);
const iterations = Number(process.env.BLO_ITERATIONS ?? 100000);
const samples = Number(process.env.BLO_SAMPLES ?? 9);
if (
  !Number.isSafeInteger(iterations) || iterations < 1
  || !Number.isSafeInteger(samples) || samples < 1
) {
  throw new RangeError("BLO_ITERATIONS and BLO_SAMPLES must be positive integers");
}
let checksum = 0;

// Consume each returned value; string decoding and JS-owned image allocations
// are included. Address generation and initialization are excluded.
function measure(fn, image, count) {
  const result = measureRun(fn, image, corpus, count);
  checksum = (checksum + result.sum) | 0;
  return result;
}

const results = [];
for (const api of ["bloImage", "bloSvg", "blo"]) {
  const image = api === "bloImage";
  for (const address of corpus.slice(0, 32)) {
    assert.deepEqual(wasm[api](address), reference[api](address));
  }
  for (let i = 0; i < 3; i++) {
    measure(reference[api], image, 30000);
    measure(wasm[api], image, 30000);
  }
  const jsTimes = [];
  const wasmTimes = [];
  for (let i = 0; i < samples; i++) {
    // Alternate order to reduce bias from thermal changes and GC timing.
    const order = i % 2 ? ["wasm", "js"] : ["js", "wasm"];
    const sample = {};
    for (const name of order) {
      sample[name] = measure(
        name === "js" ? reference[api] : wasm[api],
        image,
        iterations,
      );
      (name === "js" ? jsTimes : wasmTimes).push(sample[name].ns);
    }
    assert.equal(sample.js.sum, sample.wasm.sum, `${api} benchmark checksums match`);
  }
  const jsNs = median(jsTimes);
  const wasmNs = median(wasmTimes);
  results.push({
    api,
    jsNs,
    wasmNs,
    speedup: jsNs / wasmNs,
    jsSamplesNs: jsTimes,
    wasmSamplesNs: wasmTimes,
  });
}

const report = {
  date: new Date().toISOString(),
  runtime: typeof Bun !== "undefined"
    ? `Bun ${Bun.version}`
    : `Node ${process.version}`,
  cpu: cpus()[0]?.model,
  platform: `${process.platform}/${process.arch}`,
  iterations,
  samples,
  addressCount: corpus.length,
  startupMs,
  wasmBytes: bytes.length,
  wasmGzipBytes: gzipSync(bytes).length,
  results,
  checksum,
};
console.log(`${report.runtime} | ${report.cpu}`);
console.log(
  `${samples} samples × ${iterations.toLocaleString()} calls, ${corpus.length} varied addresses; median time per call`,
);
console.table(results.map(({ api, jsNs, wasmNs, speedup }) => ({
  API: api,
  "JS (µs)": (jsNs / 1000).toFixed(3),
  "Wasm (µs)": (wasmNs / 1000).toFixed(3),
  "JS/Wasm": `${speedup.toFixed(2)}×`,
  "Wasm ops/s": Math.round(1e9 / wasmNs).toLocaleString(),
})));
console.log(
  `Wasm ${bytes.length} bytes / ${report.wasmGzipBytes} gzip; synchronous init (decode + compile + instantiate + adapter) ${
    startupMs.toFixed(2)
  } ms (module import excluded).`,
);
if (process.argv[2]) {
  writeFileSync(process.argv[2], JSON.stringify(report, null, 2) + "\n");
}
