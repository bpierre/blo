import type { Address, BloImage } from "./types.js";
import { type BloWasm, createAdapter } from "./wasm/adapter.js";
import { binary } from "./wasm/bytes.js";

export type {
  Address,
  BloImage,
  BloImageData,
  Hsl,
  Palette,
  PaletteIndex,
} from "./types.js";

let instance: BloWasm | undefined;

/** Prepare the embedded Wasm synchronously. Optional and safe to call repeatedly. */
export function init(): void {
  if (instance) return;
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const module = new WebAssembly.Module(bytes);
  instance = createAdapter(new WebAssembly.Instance(module));
}

export function blo(address: Address, size: number = 64): string {
  if (!instance) init();
  return instance!.blo(address, size);
}

export function bloSvg(address: Address, size: number = 64): string {
  if (!instance) init();
  return instance!.bloSvg(address, size);
}

export function bloImage(address: Address): BloImage {
  if (!instance) init();
  return instance!.bloImage(address);
}
