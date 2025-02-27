import type { BloImage, Hsl, Palette, Seed } from "./types";

import { image } from "./image";
import { svg } from "./svg";

export type {
  Address,
  BloImage,
  BloImageData,
  Hsl,
  Palette,
  PaletteIndex,
  Seed
} from "./types";

export function blo(seed: Seed, size: number = 64, pallette?: Palette): string {
  return "data:image/svg+xml;base64," + btoa(bloSvg(seed, size, pallette));
}

export function bloSvg(seed: Seed, size: number = 64, palette?: Palette): string {
  return svg(seed, size, palette);
}

export function bloImage(seed: Seed, palette?: Palette): BloImage {
  return image(seed, palette);
}

export function hsl(hue: number, saturation: number, lightness: number): Hsl {
  return Uint16Array.from([hue, saturation, lightness]);
}
