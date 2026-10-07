# Released performance reference

`node experimental/baseline/build.mjs` reconstructs the TS and Rust/Wasm
implementation from the local `v2.1.0` Git tag. Generated files stay in `dist/`.
The experimental comparisons use this reference so rebuilding current
sources cannot silently change the baseline. Rust and the Wasm target are required.

Check the current package against the released output from the repository root:

```sh
pnpm run build
node experimental/baseline/build.mjs
node experimental/baseline/test.mjs
bun experimental/baseline/test.mjs
```

The local `v2.1.0` tag must be available. Tests cover all three APIs for 11,009
inputs, including random UTF-16 and lowercasing edge cases, numeric sizes,
independent returned arrays, long TS seeds, and the existing Wasm seed bound.
