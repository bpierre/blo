import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const [format, first, encoding = "fallback"] = process.argv.slice(2);
if (!format) {
  for (const format of ["esm", "cjs"]) {
    for (const first of ["init", "blo", "bloSvg", "bloImage"]) {
      for (const encoding of ["fallback", "native"]) {
        execFileSync(
          process.execPath,
          [fileURLToPath(import.meta.url), format, first, encoding],
          { stdio: "inherit" },
        );
      }
    }
  }
  console.log(
    "Passed ESM/CJS exports, lazy synchronous startup, optional idempotent init, and retry after initialization failure.",
  );
} else {
  let nativeCalls = 0;
  const native = Uint8Array.prototype.toBase64;
  Object.defineProperty(Uint8Array.prototype, "toBase64", {
    configurable: true,
    value: encoding === "native"
      ? function() {
        nativeCalls++;
        return native
          ? native.call(this)
          : Buffer.from(this.buffer, this.byteOffset, this.byteLength).toString(
            "base64",
          );
      }
      : undefined,
  });
  let modules = 0;
  let instances = 0;
  let fail = false;
  const OriginalModule = WebAssembly.Module;
  WebAssembly.Module = new Proxy(OriginalModule, {
    construct(target, args) {
      if (fail) throw new Error("Simulated compilation failure");
      modules++;
      return Reflect.construct(target, args);
    },
  });
  WebAssembly.Instance = new Proxy(WebAssembly.Instance, {
    construct(target, args) {
      instances++;
      return Reflect.construct(target, args);
    },
  });
  const forbidden = () => {
    throw new Error("Unexpected asynchronous Wasm loading");
  };
  globalThis.fetch = forbidden;
  WebAssembly.compile = forbidden;
  WebAssembly.instantiate = forbidden;
  WebAssembly.compileStreaming = forbidden;
  WebAssembly.instantiateStreaming = forbidden;
  const load = async (name) =>
    format === "esm" ? import(name) : createRequire(import.meta.url)(name);
  const reference = await load("blo");
  assert.equal(modules, 0, "Root entry never compiles Wasm");
  const wasm = await load("blo/wasm");
  assert.equal(modules, 0, "Importing the Wasm entry does not compile it");
  assert.equal(instances, 0);
  assert.deepEqual(Object.keys(wasm).sort(), ["blo", "bloImage", "bloSvg", "init"]);
  const address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
  if (first === "init") {
    fail = true;
    assert.throws(() => wasm.init(), /Simulated compilation failure/);
    assert.equal(instances, 0, "A failed initialization is not cached");
    fail = false;
    assert.equal(wasm.init(), undefined, "init returns synchronously");
  } else {
    assert.deepEqual(
      wasm[first](address),
      reference[first](address),
      "First call returns its output synchronously",
    );
  }
  assert.equal(modules, 1);
  assert.equal(instances, 1);
  for (let i = 0; i < 3; i++) {
    assert.equal(wasm.init(), undefined);
    for (const api of ["blo", "bloSvg", "bloImage"]) {
      assert.deepEqual(wasm[api](address), reference[api](address));
    }
  }
  assert.equal(modules, 1, "Repeated init and calls reuse the compiled module");
  assert.equal(instances, 1, "Repeated init and calls reuse the instance");
  assert.equal(
    nativeCalls > 0,
    encoding === "native",
    "Selected native/fallback encoder was exercised",
  );
}
