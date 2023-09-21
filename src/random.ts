export function seedRandom(seed: string): () => number {
  const rseed = randSeed(seed);
  // based on Java’s String.hashCode(),
  // expanded to 4 32bit values
  return function random(): number {
    const t = rseed[0] ^ (rseed[0] << 11);
    rseed[0] = rseed[1];
    rseed[1] = rseed[2];
    rseed[2] = rseed[3];
    rseed[3] = rseed[3] ^ (rseed[3] >> 19) ^ t ^ (t >> 8);
    return (rseed[3] >>> 0) / (1 << 31 >>> 0);
  };
}

function randSeed(seed: string): Uint32Array {
  // Xorshift: [x, y, z, w] 32 bit values
  const rseed = new Uint32Array([0, 0, 0, 0]);
  for (let i = 0; i < seed.length; i++) {
    rseed[i % 4] = (rseed[i % 4] << 5) - rseed[i % 4] + seed.charCodeAt(i);
  }
  return rseed;
}
