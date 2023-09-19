import type { Address, BloImage } from "./types";

import { image } from "./image";
import { toSvg } from "./svg";

export type {
  Address,
  BloImage,
  BloImageData,
  Hsl,
  Palette,
  PaletteIndex,
} from "./types";

export function blo(address: Address, size: number = 64): string {
  return "data:image/svg+xml;base64," + btoa(bloSvg(address, size));
}

export function bloSvg(address: Address, size: number = 64): string {
  return toSvg(bloImage(address), size);
}

export function bloImage(address: Address): BloImage {
  return image(address.toLowerCase());
}
