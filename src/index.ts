import type { Address, BloImage, Hsl, Palette } from "./types";

import { image } from "./image";
import { svg } from "./svg";

export type {
  Address,
  BloImage,
  BloImageData,
  Hsl,
  Palette,
  PaletteIndex,
} from "./types";

export function blo(address: Address, size: number = 64, pallette?: Palette): string {
  return "data:image/svg+xml;base64," + btoa(bloSvg(address, size, pallette));
}

export function bloSvg(address: Address, size: number = 64, palette?: Palette): string {
  return svg(address, size, palette);
}

export function bloImage(address: Address, palette?: Palette): BloImage {
  return image(address, palette);
}

export function hsl(hue: number, saturation: number, lightness: number): Hsl {
  return Uint16Array.from([hue, saturation, lightness]);
}
