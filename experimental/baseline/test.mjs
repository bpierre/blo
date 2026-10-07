import * as typescript from "blo";
import * as wasm from "blo/wasm";
import assert from "node:assert/strict";
import { addresses } from "../wasm/fixtures.mjs";
import * as released from "./dist/esm/index.js";

const corpus = [
  ...addresses(10000),
  "0x0000000000000000000000000000000000000000",
  "0xffffffffffffffffffffffffffffffffffffffff",
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "0x",
  "0xABCDEF",
  "",
  "0xİΣẞ🦀",
  "0x\ud800\udfff\ud800",
  "0x" + "a".repeat(65534),
];
let state = 0x73d259;
for (let i = 0; i < 1000; i++) {
  let input = "0x";
  for (let j = 0; j < i % 67; j++) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    input += String.fromCharCode(state & 65535);
  }
  corpus.push(input);
}

for (const [name, api] of Object.entries({ typescript, wasm })) {
  for (const input of corpus) {
    for (const method of ["blo", "bloSvg", "bloImage"]) {
      assert.deepEqual(
        api[method](input),
        released[method](input),
        name + " " + method,
      );
    }
  }
  for (const input of corpus.slice(-10)) {
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
        64,
      ]
    ) {
      assert.equal(api.blo(input, size), released.blo(input, size));
      assert.equal(api.bloSvg(input, size), released.bloSvg(input, size));
    }
  }
  const saved = api.bloImage(corpus[0]);
  api.blo(corpus[1]);
  api.bloImage(corpus[1]);
  assert.deepEqual(saved, released.bloImage(corpus[0]), "Images own their memory");
  saved[0].fill(255);
  saved[1][0].fill(65535);
  assert.deepEqual(api.bloImage(corpus[0]), released.bloImage(corpus[0]));
}

const longInput = "0x" + "a".repeat(70000);
for (const method of ["blo", "bloSvg", "bloImage"]) {
  assert.deepEqual(typescript[method](longInput), released[method](longInput));
  assert.throws(() => wasm[method](longInput), RangeError);
  assert.throws(() => wasm[method]("İ".repeat(32769)), RangeError);
  assert.deepEqual(wasm[method](corpus[0]), released[method](corpus[0]));
}
console.log(
  `Current TS/Wasm match released 2.1 for ${corpus.length.toLocaleString()} inputs, numeric sizes, ownership, and seed bounds.`,
);
