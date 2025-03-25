import type { Address, BloImage } from "./types.js";

import { image } from "./image.js";
import { svg } from "./svg.js";

export type {
  Address,
  BloImage,
  BloImageData,
  Hsl,
  Palette,
  PaletteIndex,
} from "./types.js";

export function blo(address: Address, size: number = 64): string {
  return "data:image/svg+xml;base64," + btoa(bloSvg(address, size));
}

export function bloSvg(address: Address, size: number = 64): string {
  return svg(address, size);
}

export function bloImage(address: Address): BloImage {
  return image(address);
}
