export const SAMPLE_TARGET_MS = 250;
const BATCH_TARGET_MS = 50;
const MAX_CALLS = 1000000;
const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0));

// Only generation and output consumption are timed. Batch sizing comes from
// calibration, so fast libraries aren't measured in sub-millisecond fragments.
export async function measureSample(fn, corpus, signal, {
  batchSize = corpus.length,
  preview = () => {},
  now = () => performance.now(),
  yieldTask = yieldToBrowser,
} = {}) {
  let elapsedMs = 0;
  let sum = 0;
  let last;
  for (let i = 0; i < corpus.length;) {
    signal.throwIfAborted();
    const end = Math.min(corpus.length, i + batchSize);
    const start = now();
    for (; i < end; i++) {
      last = fn(corpus[i]);
      sum = (sum + last.length + last.charCodeAt(i % last.length)) | 0;
    }
    elapsedMs += now() - start;
    preview(last);
    await yieldTask();
  }
  signal.throwIfAborted();
  return { ns: elapsedMs * 1e6 / corpus.length, elapsedMs, sum };
}

export async function calibrate(fn, nextAddresses, signal, preview) {
  let count = 256;
  while (true) {
    const result = await measureSample(fn, nextAddresses(count), signal, {
      preview,
    });
    if (result.elapsedMs >= BATCH_TARGET_MS || count === MAX_CALLS) {
      if (result.ns <= 0) {
        throw new Error("Browser timer is too coarse to measure this library");
      }
      return result.ns;
    }
    count = Math.min(MAX_CALLS, count * 2);
  }
}

export function samplePlan(ns, minimumCalls) {
  return {
    count: Math.min(
      MAX_CALLS,
      Math.max(minimumCalls, Math.ceil(SAMPLE_TARGET_MS * 1e6 / ns)),
    ),
    batchSize: Math.max(1, Math.ceil(BATCH_TARGET_MS * 1e6 / ns)),
  };
}
