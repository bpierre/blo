import type { BloImage, BloImageData, Hsl, Palette, PaletteIndex, Seed } from "./types";

import { seedRandom } from "./random";

// The random() calls must happen in this exact order:
// 1. palette: main color (6 calls, if no custom palette)
// 2. palette: background (6 calls, if no custom palette)
// 3. palette: spot color (6 calls, if no custom palette)
// 4. image data (32 calls)

export function image(seed: Seed, palette?: Palette): BloImage {
  const random = seedRandom(seed.toLowerCase());
  const selectedPalette = palette ?? randomPalette(random);
  const data = randomImageData(random);
  return [data, selectedPalette];
}

export function randomImageData(random: () => number): BloImageData {
  const data = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    data[i] = Math.floor(
      // background: 43% chances
      // color:      43% chances
      // spot:       13% chances
      random() * 2.3,
    ) as PaletteIndex; // guaranteed to be 0 | 1 | 2
  }
  return data;
}

export function randomPalette(random: () => number): [Hsl, Hsl, Hsl] {
  // calls order is significant
  const c = randomColor(random);
  const b = randomColor(random);
  const s = randomColor(random);
  return [b, c, s];
}

export function randomColor(rand: () => number): Hsl {
  // Math.floor() calls omitted since Uint16Array() does it
  return new Uint16Array([
    // hue = 0 to 360 (whole color spectrum)
    rand() * 360,
    // saturation = 40 to 100 (avoid greyish colors)
    40 + rand() * 60,
    // lightness = 0 to 100 but probabilities are a bell curve around 50%
    (rand() + rand() + rand() + rand()) * 25,
  ]);
}
