import type { Address } from "blo";

type Generator = (address: Address) => string;
type Preview = (uri: string) => void;
interface SampleOptions {
  batchSize?: number;
  preview?: Preview;
  now?: () => number;
  yieldTask?: () => Promise<void>;
}

export const SAMPLE_TARGET_MS = 250;
const BATCH_TARGET_MS = 50;
const MAX_CALLS = 1000000;
const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

// Only generation and output consumption are timed. Batch sizing comes from
// calibration, so fast libraries aren't measured in sub-millisecond fragments.
export async function measureSample(
  fn: Generator,
  corpus: readonly Address[],
  signal: AbortSignal,
  {
    batchSize = corpus.length,
    preview = () => {},
    now = () => performance.now(),
    yieldTask = yieldToBrowser,
  }: SampleOptions = {},
) {
  let elapsedMs = 0;
  let sum = 0;
  let last = "";
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

export async function calibrate(
  fn: Generator,
  nextAddresses: (count: number) => Address[],
  signal: AbortSignal,
  preview: Preview,
) {
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

export function samplePlan(ns: number, minimumCalls: number) {
  return {
    count: Math.min(
      MAX_CALLS,
      Math.max(minimumCalls, Math.ceil(SAMPLE_TARGET_MS * 1e6 / ns)),
    ),
    batchSize: Math.max(1, Math.ceil(BATCH_TARGET_MS * 1e6 / ns)),
  };
}
