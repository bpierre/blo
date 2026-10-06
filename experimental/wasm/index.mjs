import { createAdapter } from "./dist/reference/wasm/adapter.js";

/** Low-level experiment: supply bytes or a compiled module for a separate instance. */
export async function createBloWasm(source) {
  const result = await WebAssembly.instantiate(source);
  const instance = result instanceof WebAssembly.Instance ? result : result.instance;
  return createAdapter(instance);
}
