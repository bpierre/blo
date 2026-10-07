import { Random } from "./random.js";
import type { Address, BloImage, Hsl } from "./types.js";

export function randomColor(random: Random): Hsl {
  // Uint16Array assignments truncate the values, so Math.floor() is unnecessary.
  const color = new Uint16Array(3);
  // Hue spans the whole color spectrum.
  color[0] = random.next() * 360;
  // Saturation between 40% and 100% avoids greyish colors.
  color[1] = 40 + random.next() * 60;
  // Summing four draws gives lightness a bell-shaped distribution around 50%.
  color[2] = (random.next() + random.next() + random.next() + random.next()) * 25;
  return color;
}

export function image(address: Address): BloImage {
  const random = new Random(address);
  // Random draws must happen in this exact order to preserve the identicon:
  // 1. palette: main color (6 calls)
  // 2. palette: background (6 calls)
  // 3. palette: spot color (6 calls)
  // 4. image data (32 calls)
  const color = randomColor(random);
  const background = randomColor(random);
  const spot = randomColor(random);
  const data = new Uint8Array(32);
  // Truncating random * 2.3 gives palette indices 0 | 1 | 2:
  // background ~43%, main color ~43%, spot color ~13%.
  // Uint8Array assignment supplies the truncation without Math.floor().
  for (let i = 0; i < 32; i++) data[i] = random.next() * 2.3;
  return [data, [background, color, spot]];
}
