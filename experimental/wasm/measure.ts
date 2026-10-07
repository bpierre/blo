import type { Address, BloImage } from "../../src/types.js";

export type Generator =
  | ((address: Address) => string)
  | ((address: Address) => BloImage);

// Shared by the CLI and browser benchmark. Output consumption, string decoding,
// and image ownership costs belong inside the timed loop; fixture generation
// and initialization do not.
export function measure(
  fn: Generator,
  image: boolean,
  corpus: readonly Address[],
  count: number,
) {
  let sum = 0;
  const mask = corpus.length - 1;
  const start = performance.now();
  if (image) {
    const generate = fn as (address: Address) => BloImage;
    for (let i = 0; i < count; i++) {
      const [pixels, colors] = generate(corpus[i & mask]);
      sum = (sum + pixels[i & 31] + colors[i % 3][i % 3]) | 0;
    }
  } else {
    const generate = fn as (address: Address) => string;
    for (let i = 0; i < count; i++) {
      const result = generate(corpus[i & mask]);
      sum = (sum + result.length + result.charCodeAt(i % result.length)) | 0;
    }
  }
  return { ns: (performance.now() - start) * 1e6 / count, sum };
}

export function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}
