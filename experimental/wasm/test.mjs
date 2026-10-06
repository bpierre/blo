import * as packaged from "blo/wasm";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as reference from "./dist/reference/index.js";
import { addresses } from "./fixtures.mjs";
import { createBloWasm } from "./index.mjs";

const bytes = readFileSync(new URL("dist/blo.wasm", import.meta.url));
const module = await WebAssembly.compile(bytes);
assert.deepEqual(WebAssembly.Module.imports(module), [], "No runtime dependencies");
const wasm = await createBloWasm(bytes);
const second = await createBloWasm(module);
const corpus = [
  "0x0000000000000000000000000000000000000000",
  "0xffffffffffffffffffffffffffffffffffffffff",
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "0x",
  "0xABCDEF",
  "",
  "0xİΣẞ🦀",
  "0x\ud800\udfff\ud800",
  "0x" + "a".repeat(65534),
  ...addresses(10000),
];

for (const address of corpus) {
  assert.deepEqual(packaged.bloImage(address), reference.bloImage(address));
  assert.equal(packaged.bloSvg(address), reference.bloSvg(address));
  assert.equal(packaged.blo(address), reference.blo(address));
  assert.deepEqual(
    wasm.bloImage(address),
    reference.bloImage(address),
    `image ${address.slice(0, 80)}`,
  );
  assert.equal(
    wasm.bloSvg(address),
    reference.bloSvg(address),
    `svg ${address.slice(0, 80)}`,
  );
  assert.equal(
    wasm.blo(address),
    reference.blo(address),
    `uri ${address.slice(0, 80)}`,
  );
}
for (const address of corpus.slice(0, 8)) {
  for (
    const size of [
      undefined,
      0,
      -0,
      1,
      24,
      256,
      -1,
      0.5,
      1 / 3,
      1e-7,
      1e21,
      Number.MAX_VALUE,
      Number.MIN_VALUE,
      Infinity,
      -Infinity,
      NaN,
    ]
  ) {
    assert.equal(packaged.bloSvg(address, size), reference.bloSvg(address, size));
    assert.equal(packaged.blo(address, size), reference.blo(address, size));
    assert.equal(wasm.bloSvg(address, size), reference.bloSvg(address, size));
    assert.equal(wasm.blo(address, size), reference.blo(address, size));
  }
}

for (const api of [wasm, packaged]) {
  const saved = api.bloImage(corpus[2]);
  api.bloImage(corpus[1]);
  api.blo(corpus[0]);
  assert.deepEqual(
    saved,
    reference.bloImage(corpus[2]),
    "Returned images own their memory",
  );
  saved[0].fill(255);
  saved[1][0].fill(65535);
  assert.deepEqual(
    api.bloImage(corpus[2]),
    reference.bloImage(corpus[2]),
    "Mutating results cannot affect Wasm",
  );
}
assert.equal(
  second.blo(corpus[2]),
  reference.blo(corpus[2]),
  "Compiled-module input and separate instances work",
);
for (const api of [wasm, packaged]) {
  assert.throws(() => api.blo("0x" + "a".repeat(65535)), RangeError);
  assert.throws(
    () => api.blo("İ".repeat(32769)),
    RangeError,
    "Limit applies after Unicode lowercasing",
  );
  assert.equal(
    api.blo(corpus[2]),
    reference.blo(corpus[2]),
    "Usable after rejected input",
  );
}

const raw = new WebAssembly.Instance(module).exports;
assert.throws(() => raw.render(65537, 2, 2), WebAssembly.RuntimeError);
assert.throws(() => raw.render(42, 33, 2), WebAssembly.RuntimeError);
assert.throws(() => raw.render(42, 2, 3), WebAssembly.RuntimeError);
console.log(
  `Passed exact image/SVG/data URI parity for ${corpus.length.toLocaleString()} seeds, numeric sizes, ownership, and ABI bounds.`,
);
