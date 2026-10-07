/** Low-level experiment: supply bytes or a compiled module for a separate instance. */
export async function createBloWasm(source: BufferSource | WebAssembly.Module) {
  const { createAdapter }: typeof import("../../src/wasm/adapter.js") = await import(
    new URL("dist/reference/wasm/adapter.js", import.meta.url).href
  );

  const instance = source instanceof WebAssembly.Module
    ? await WebAssembly.instantiate(source)
    : (await WebAssembly.instantiate(source)).instance;
  return createAdapter(instance);
}
