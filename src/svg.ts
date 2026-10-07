import { Random } from "./random.js";
import type { Address } from "./types.js";

// Generate the left 4x8 pixels, mirrored horizontally at x and 7 - x.
// Each lookup entry contains both square paths of the final 8x8 icon.
const squares = Array.from({ length: 32 }, (_, i) => {
  const x = i & 3; // same as i % 4
  const y = i >> 2; // same as Math.floor(i / 4)
  return `M${x},${y}h1v1h-1zM${7 - x},${y}h1v1h-1z`;
});

function colorPath(random: Random): string {
  // Match randomColor()'s six draws and integer truncation without a palette array.
  const h = random.next() * 360 | 0;
  const s = 40 + random.next() * 60 | 0;
  const l = (random.next() + random.next() + random.next() + random.next()) * 25 | 0;
  return "<path fill=\"hsl(" + h + " " + s + "% " + l + "%)\" d=\"";
}

export function svg(address: Address, size: number): string {
  const random = new Random(address);
  // Keep image()'s draw order: main color, background, spot, then the pixels.
  const color = colorPath(random);
  const background = colorPath(random);
  const spot = colorPath(random);
  let colorSquares = "";
  let spotSquares = "";
  // Generate SVG directly, without allocating image or palette arrays.
  // Index 0 needs no squares: the full background path already covers it.
  for (let i = 0; i < 32; i++) {
    const pixel = random.next() * 2.3 | 0;
    if (pixel === 1) colorSquares += squares[i];
    else if (pixel === 2) spotSquares += squares[i];
  }
  // Square <path> geometry keeps icons sharp with shape-rendering="optimizeSpeed".
  return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 8 8\" shape-rendering=\"optimizeSpeed\" "
    + "width=\"" + size + "\" height=\"" + size + "\">"
    + background + "M0,0H8V8H0z\"/>"
    + color + colorSquares + "\"/>"
    + spot + spotSquares + "\"/></svg>";
}
