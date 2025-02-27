import type { Palette, Seed } from "./types";

import { randomPalette } from "./image";
import { seedRandom } from "./random";

const SVG_START = `<svg `
  + `xmlns="http://www.w3.org/2000/svg" `
  + `viewBox="0 0 8 8" `
  + `shape-rendering="optimizeSpeed" `; // optimizeSpeed stays sharp thanks to using <path />

export function svg(seed: Seed, size: number, pallette?: Palette) {
  const random = seedRandom(seed.toLowerCase());

  const [b, c, s] = pallette ?? randomPalette(random);

  const paths = [
    `M0,0H8V8H0z`, // background
    ``, // color
    ``, // spot
  ];

  for (let i = 0, x, y; i < 32; i++) {
    x = i % 4;
    y = Math.floor(i / 4);
    const colorIndex = Math.floor(random() * 2.3);
    if (colorIndex > 0) {
      paths[colorIndex] += `M${x},${y}h1v1h-1zM${7 - x},${y}h1v1h-1z`;
    }
  }

  return `${SVG_START}width="${size}" height="${size}">`
    + `<path fill="hsl(${b[0]} ${b[1]}% ${b[2]}%)" d="${paths[0]}"/>`
    + `<path fill="hsl(${c[0]} ${c[1]}% ${c[2]}%)" d="${paths[1]}"/>`
    + `<path fill="hsl(${s[0]} ${s[1]}% ${s[2]}%)" d="${paths[2]}"/>`
    + "</svg>";
}
