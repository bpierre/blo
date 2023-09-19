import type { BloImage, BloImageData, Hsl, PaletteIndex } from "./types";

export function image(seed: string): BloImage {
  const random = seedRandom(seed);

  // the palette calls order is significant
  const c = randomColor(random);
  const b = randomColor(random);
  const s = randomColor(random);

  return [
    randomImageData(random),
    [b, c, s],
  ];
}

export function randomImageData(random: () => number): BloImageData {
  const data = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    data[
      // row
      Math.floor(i / 4) * 4
      // column
      + i % 4
    ] = Math.floor(
      // background: 43% chances
      // color:      43% chances
      // spot:       13% chances
      random() * 2.3,
    ) as PaletteIndex; // guaranteed to be 0 | 1 | 2
  }
  return data;
}

export function randomColor(rand: () => number): Hsl {
  return new Uint16Array([
    // hue = 0 to 360 (whole color spectrum)
    Math.floor(rand() * 360),
    // saturation = 40 to 100 (avoid greyish colors)
    Math.floor(40 + rand() * 60),
    // lightness = 0 to 100 but probabilities are a bell curve around 50%
    Math.floor((rand() + rand() + rand() + rand()) * 25),
  ]);
}

export function seedRandom(seed: string): () => number {
  const rseed = randSeed(seed);
  return function random(): number {
    // based on Java’s String.hashCode(), expanded to 4 32bit values
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
