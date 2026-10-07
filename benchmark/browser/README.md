# Browser benchmark

The original browser benchmark's centered white table, score bars, native Run
buttons, and two 64×64 previews per row, with a new runner and a Rust/Wasm row.

Libraries:

- blo (current package)
- blo/wasm (current package)
- ethereum-blockies-base64
- blockies-react-svg
- @download/blockies
- blockies-ts
- react-blockies

Install repository and benchmark dependencies and the Rust Wasm target, then
run from the repository root:

```sh
pnpm install
pnpm --dir benchmark install
rustup target add wasm32-unknown-unknown
pnpm run bench:browser
```

Open **http://127.0.0.1:5174**. The command builds the current package and a
browser bundle of all libraries. Both Blo rows use the built package entries,
including the selected TS and Rust optimizations. Synchronous Wasm
initialization is timed separately and included in exported results, together with
native base64 availability. The current adapter uses native byte-to-base64 encoding
when available and the Wasm encoder otherwise. No CDN is needed.

Use each row's **Run** button, or **Run all**. Select minimum calls per sample and
sample count underneath. The runner calibrates actual call counts to target
250 ms of generation per sample, so fast implementations aren't compared using
just a few timer ticks. The left preview changes during the benchmark; the right
preview keeps the original sample address. Score bars compare completed
throughput measurements. Stop discards incomplete results; JSON export includes
only completed results, with their raw sample timings, actual call counts, batch
sizes, and settings.

The old page measured React mounts. This replacement measures **data URI
generation**, including SVG/base64 or canvas/PNG encoding, and consumes every
output. DOM display and React mounting are excluded. Canvas libraries generate
128×128 raster images, displayed at 64×64, matching the original page's settings.
The React library's own canvas generator is called directly, as in the existing
CLI benchmark, without react-component-benchmark.

Runs warm each implementation, alternate measurement order between samples,
and report the median. All libraries in a Run all comparison receive the same
addresses, with equal call counts for blo and blo/wasm. Other libraries
use the same address prefixes with individually calibrated counts. Addresses are
generated before timing from one continuous sequence and are fresh on every run;
warmup and timed addresses are distinct. This prevents blockies-react-svg's
internal cache from substituting lookups for icon generation. Both Blo implementations
are checked for identical output before benchmarking and matching checksums
when run together.

DOM canvas APIs require the main browser thread. The runner yields between
calibrated batches targeting 50 ms so previews and Stop remain responsive. Yields,
address generation, and preview updates are excluded from timings. Keep the tab
visible and use larger sample counts for more stable measurements.

Choose a different port with:

```sh
BLO_BENCH_PORT=5180 pnpm run bench:browser
```

Changing Rust, TypeScript, or dependency versions requires rerunning the command
to rebuild. HTML, CSS, and page script edits need only a reload. The existing
all-library CLI benchmark remains in `benchmark/index.ts`; the separate
Rust/Wasm CLI experiment still benchmarks all three Blo APIs.
