import type { Address } from "blo";
import assert from "node:assert/strict";
import { addresses, addressSequence } from "../../experimental/wasm/fixtures.js";
import { measureSample, samplePlan } from "./runner.js";

// Splitting corpus generation must retain the original fixture sequence and
// keep calibration/sample inputs distinct, rather than restarting a cache hit.
const next = addressSequence(0x87654321);
const first = next(1000);
const second = next(2000);
assert.deepEqual([...first, ...second], addresses(3000, 0x87654321));
assert.equal(new Set([...first, ...second]).size, 3000);

// Reproduce a browser whose clock is rounded to 1 ms and whose task scheduler
// aligns subsequent batches with timer ticks. Old 100-call batches measure zero.
const costNs = 4123;
const plan = samplePlan(costNs, 1000);
const corpus = addresses(plan.count);
let clock = 0;
let calls = 0;
const fn = (address: Address) => {
  clock += costNs / 1e6;
  calls++;
  return address;
};
const options = {
  now: () => Math.floor(clock),
  yieldTask: async () => {
    clock = Math.ceil(clock) + 4;
  },
};
const old = await measureSample(
  fn,
  corpus.slice(0, 1000),
  new AbortController().signal,
  {
    ...options,
    batchSize: 100,
  },
);
assert.equal(old.elapsedMs, 0);
clock = 0;
calls = 0;
const measured = await measureSample(fn, corpus, new AbortController().signal, {
  ...options,
  batchSize: plan.batchSize,
  preview: () => {
    clock += 20;
  }, // Preview work must not be included.
});
assert.equal(calls, corpus.length);
assert.ok(Math.abs(measured.ns / costNs - 1) < 0.01);

// Cancellation between batches must discard incomplete measurements.
const controller = new AbortController();
calls = 0;
await assert.rejects(
  measureSample(fn, corpus, controller.signal, {
    ...options,
    batchSize: 1000,
    yieldTask: async () => {
      controller.abort();
    },
  }),
  { name: "AbortError" },
);
assert.equal(calls, 1000);
console.log(
  "Passed rounded-clock accuracy, fixture continuity, preview exclusion, and cancellation.",
);
