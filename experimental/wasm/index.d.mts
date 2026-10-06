import type { Address, BloImage } from "../../src/types.js";

export interface BloWasm {
  blo(address: Address, size?: number): string;
  bloSvg(address: Address, size?: number): string;
  bloImage(address: Address): BloImage;
}

export function createBloWasm(source: BufferSource | WebAssembly.Module): Promise<BloWasm>;
