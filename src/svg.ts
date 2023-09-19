import type { BloImage } from "./types";

const SVG_START = `<svg `
  + `xmlns="http://www.w3.org/2000/svg" `
  + `viewBox="0 0 8 8" `
  + `shape-rendering="optimizeSpeed" `; // stays sharp thanks to <path />
const SVG_END = "</svg>";

export function toSvg([data, [b, c, s]]: BloImage, size: number) {
  const paths = ["", ""]; // color + spot
  for (let i = 0, x, y; i < data.length; i++) {
    if (data[i]) {
      [x, y] = [i % 4, Math.floor(i / 4)];
      paths[data[i] - 1] += `M${x},${y}h1v1h-1zM${7 - x},${y}h1v1h-1z`;
    }
  }
  return SVG_START + `width="${size}" height="${size}">`
    + `<path fill="hsl(${b[0]} ${b[1]}% ${b[2]}%)" d="M0,0H8V8H0z"/>`
    + `<path fill="hsl(${c[0]} ${c[1]}% ${c[2]}%)" d="${paths[0]}"/>`
    + `<path fill="hsl(${s[0]} ${s[1]}% ${s[2]}%)" d="${paths[1]}"/>`
    + SVG_END;
}
