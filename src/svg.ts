import { Random } from "./random.js";
import type { Address } from "./types.js";

const squares = /* @__PURE__ */ Array.from({ length: 32 }, (_, i) => {
  const x = i & 3;
  const y = i >> 2;
  return `M${x},${y}h1v1h-1zM${7 - x},${y}h1v1h-1z`;
});

function colorPath(random: Random): string {
  const h = random.next() * 360 | 0;
  const s = 40 + random.next() * 60 | 0;
  const l = (random.next() + random.next() + random.next() + random.next()) * 25 | 0;
  return "<path fill=\"hsl(" + h + " " + s + "% " + l + "%)\" d=\"";
}

export function svg(address: Address, size: number): string {
  const random = new Random(address);
  const color = colorPath(random);
  const background = colorPath(random);
  const spot = colorPath(random);
  let colorSquares = "";
  let spotSquares = "";
  // Generate SVG directly, without allocating image or palette arrays.
  for (let i = 0; i < 32; i++) {
    const pixel = random.next() * 2.3 | 0;
    if (pixel === 1) colorSquares += squares[i];
    else if (pixel === 2) spotSquares += squares[i];
  }
  return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 8 8\" shape-rendering=\"optimizeSpeed\" "
    + "width=\"" + size + "\" height=\"" + size + "\">"
    + background + "M0,0H8V8H0z\"/>"
    + color + colorSquares + "\"/>"
    + spot + spotSquares + "\"/></svg>";
}
