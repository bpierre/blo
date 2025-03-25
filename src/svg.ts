import type { Address } from "./types.js";

import { image } from "./image.js";

const SVG_START = "<svg "
  + "xmlns=\"http://www.w3.org/2000/svg\" "
  + "viewBox=\"0 0 8 8\" "
  + "shape-rendering=\"optimizeSpeed\" "; // optimizeSpeed stays sharp thanks to using <path />
const SVG_END = "</svg>";

const PATH_1 = "<path fill=\"hsl(";
const PATH_2 = "% ";
const PATH_3 = "%)\" d=\"";
const PATH_4 = "\"/>";

const BACKGROUND_D = "M0,0H8V8H0z";

export function svg(address: Address, size: number) {
  const [data, [b, c, s]] = image(address);

  const paths = [
    "", // color
    "", // spot
  ];

  for (let i = 0, x, y; i < 32; i++) {
    if (data[i] === 0) { // skip background
      continue;
    }

    x = i & 3; // same as i % 4
    y = i >> 2; // same as Math.floor(i / 4)

    // pixel on the left side (x) mirrored horizontally (7 - x)
    const square = "," + y + "h1v1h-1z";
    paths[data[i] - 1] += "M" + x + square + "M" + (7 - x) + square;
  }

  return SVG_START + "width=\"" + size + "\" height=\"" + size + "\">"
    + PATH_1 + b[0] + " " + b[1] + PATH_2 + b[2] + PATH_3 + BACKGROUND_D + PATH_4
    + PATH_1 + c[0] + " " + c[1] + PATH_2 + c[2] + PATH_3 + paths[0] + PATH_4
    + PATH_1 + s[0] + " " + s[1] + PATH_2 + s[2] + PATH_3 + paths[1] + PATH_4
    + SVG_END;
}
