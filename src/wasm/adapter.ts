import type { Address, BloImage } from "../types.js";

export interface BloWasm {
  blo(address: Address, size?: number): string;
  bloSvg(address: Address, size?: number): string;
  bloImage(address: Address): BloImage;
}

interface WasmExports extends WebAssembly.Exports {
  memory: WebAssembly.Memory;
  seed_ptr(): number;
  seed_capacity(): number;
  size_ptr(): number;
  image_ptr(): number;
  svg_ptr(): number;
  uri_ptr(): number;
  render(seedLength: number, sizeLength: number, mode: number): number;
}

export function createAdapter(instance: WebAssembly.Instance): BloWasm {
  const wasm = instance.exports as WasmExports;
  const memory = wasm.memory.buffer;
  const seed = new Uint16Array(memory, wasm.seed_ptr(), wasm.seed_capacity());
  const sizeBytes = new Uint8Array(memory, wasm.size_ptr(), 32);
  const imageBytes = new Uint8Array(memory, wasm.image_ptr(), 50);
  const colors = new DataView(memory, wasm.image_ptr() + 32, 18);
  const svgBytes = new Uint8Array(memory, wasm.svg_ptr(), 1536);
  const uriBytes = new Uint8Array(memory, wasm.uri_ptr(), 2073);
  const decoder = new TextDecoder();

  function color(offset: number) {
    const value = new Uint16Array(3);
    value[0] = colors.getUint16(offset, true);
    value[1] = colors.getUint16(offset + 2, true);
    value[2] = colors.getUint16(offset + 4, true);
    return value;
  }

  function prepare(address: string) {
    // Preserve JS lowercasing and UTF-16 hash semantics, including non-ASCII
    // seeds accepted by the original library. No UTF-8 transcoding is needed.
    address = address.toLowerCase();
    const length = address.length;
    if (length > seed.length) {
      throw new RangeError(
        `Experimental blo Wasm seeds are limited to ${seed.length} UTF-16 code units`,
      );
    }
    for (let i = 0; i < length; i++) seed[i] = address.charCodeAt(i);
    return length;
  }

  function render(address: Address, size: number, mode: number) {
    const length = prepare(address);
    const text = String(size);
    if (text.length > sizeBytes.length) {
      throw new RangeError("Size representation is too long");
    }
    for (let i = 0; i < text.length; i++) sizeBytes[i] = text.charCodeAt(i);
    return wasm.render(length, text.length, mode);
  }

  return {
    blo(address, size = 64) {
      const length = render(address, size, 2);
      return decoder.decode(uriBytes.subarray(0, length));
    },
    bloSvg(address, size = 64) {
      const length = render(address, size, 1);
      return decoder.decode(svgBytes.subarray(0, length));
    },
    bloImage(address) {
      wasm.render(prepare(address), 0, 0);
      return [
        imageBytes.slice(0, 32),
        [color(0), color(6), color(12)],
      ];
    },
  };
}
