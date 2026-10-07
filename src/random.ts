import type { Address } from "./types.js";

// Xorshift state: [x, y, z, w], four 32-bit values. Scalar fields avoid
// allocating a typed array for the random state.
export class Random {
  x = 0;
  y = 0;
  z = 0;
  w = 0;

  constructor(address: Address) {
    // Based on Java's String.hashCode(), expanded to four interleaved hashes:
    // each UTF-16 code unit updates one state value with hash * 31 + code unit.
    const seed = address.toLowerCase();
    let i = 0;
    for (; i + 3 < seed.length; i += 4) {
      this.x = (Math.imul(this.x, 31) + seed.charCodeAt(i)) | 0;
      this.y = (Math.imul(this.y, 31) + seed.charCodeAt(i + 1)) | 0;
      this.z = (Math.imul(this.z, 31) + seed.charCodeAt(i + 2)) | 0;
      this.w = (Math.imul(this.w, 31) + seed.charCodeAt(i + 3)) | 0;
    }
    if (i < seed.length) this.x = (Math.imul(this.x, 31) + seed.charCodeAt(i++)) | 0;
    if (i < seed.length) this.y = (Math.imul(this.y, 31) + seed.charCodeAt(i++)) | 0;
    if (i < seed.length) this.z = (Math.imul(this.z, 31) + seed.charCodeAt(i)) | 0;
  }

  next(): number {
    // Advance xorshift once, then scale its output to [0, 1).
    const t = this.x ^ (this.x << 11);
    const w = this.w;
    this.x = this.y;
    this.y = this.z;
    this.z = w;
    // Keep signed shifts: their sign bits cancel in this XOR, making w >= 0.
    this.w = w ^ (w >> 19) ^ t ^ (t >> 8);
    return this.w * (1 / 2147483648);
  }
}
