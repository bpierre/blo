import type { Address, BloImage, Hsl, PaletteIndex } from "./types";

import { nextRandom, randSeed } from "./random";

// The random() calls must happen in this exact order:
// 1. palette: main color (6 calls)
// 2. palette: background (6 calls)
// 3. palette: spot color (6 calls)
// 4. image data (32 calls)

export function image(address: Address): BloImage {
  const rseed = randSeed(address.toLowerCase());

  const c = randomColor(rseed); // main color
  const b = randomColor(rseed); // background
  const s = randomColor(rseed); // spot color

  const data = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    data[i] = Math.floor(
      // background: 43% chances
      // color:      43% chances
      // spot:       13% chances
      nextRandom(rseed) * 2.3,
    ) as PaletteIndex; // guaranteed to be 0 | 1 | 2
  }

  return [data, [b, c, s]];
}

export function randomColor(rseed: Uint32Array): Hsl {
  // Math.floor() calls omitted since Uint16Array() does it
  return new Uint16Array([
    // hue = 0 to 360 (whole color spectrum)
    nextRandom(rseed) * 360,
    // saturation = 40 to 100 (avoid greyish colors)
    40 + nextRandom(rseed) * 60,
    // lightness = 0 to 100 but probabilities are a bell curve around 50%
    (
      nextRandom(rseed)
      + nextRandom(rseed)
      + nextRandom(rseed)
      + nextRandom(rseed)
    )
    * 25,
  ]);
}
