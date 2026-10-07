import { Random } from "./random.js";
import type { Address, BloImage, Hsl } from "./types.js";

export function randomColor(random: Random): Hsl {
  const color = new Uint16Array(3);
  color[0] = random.next() * 360;
  color[1] = 40 + random.next() * 60;
  color[2] = (random.next() + random.next() + random.next() + random.next()) * 25;
  return color;
}

export function image(address: Address): BloImage {
  const random = new Random(address);
  // Preserve draw order: main color, background, spot, then the pixels.
  const color = randomColor(random);
  const background = randomColor(random);
  const spot = randomColor(random);
  const data = new Uint8Array(32);
  for (let i = 0; i < 32; i++) data[i] = random.next() * 2.3;
  return [data, [background, color, spot]];
}
