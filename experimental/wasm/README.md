# Experimental Rust/Wasm blo

`blo/wasm` provides synchronous `blo()`, `bloSvg()`, and `bloImage()` functions
with the same outputs as the JavaScript implementation.

```ts
import { blo, init } from "blo/wasm";

init(); // Optional: prepare Wasm before the first call.
img.src = blo("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
```

The first call initializes automatically; repeated `init()` calls reuse the
instance. The Wasm bytes are included in the JavaScript as a base64 string,
so initialization needs no separate download or `await`.

Data URIs use native byte-to-base64 encoding when available, with a Wasm
fallback for older runtimes.

## Build and benchmark

Install stable Rust, then run from the repository root:

```sh
pnpm install
rustup target add wasm32-unknown-unknown
pnpm run test:wasm
pnpm run bench:wasm
```

Tests check exact output compatibility for 10,009 inputs, initialization, and
ownership of returned arrays. For the [browser comparison](../../benchmark/browser/README.md),
run `pnpm run bench:browser`.

## Tradeoffs

Run the browser comparison for performance on your engine. Initialization is
measured separately.

A minified browser bundle of `blo` and `init` measured 3.9 kB gzipped, compared
with 0.7 kB for JavaScript `blo`. Seeds are limited to 65,536 UTF-16 code units
after lowercasing (fine for Ethereum addresses); longer inputs throw `RangeError`.
