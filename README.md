<div align="center">
<img width="860" alt="blo" src="https://github.com/bpierre/blo/assets/36158/7ddc0bf0-076d-4c5a-8624-cc8646e4c5aa">
  <br><strong>blo</strong> is a small and fast library to generate Ethereum identicons.
  <br><br>
</div>

<p align=center><a href="https://www.npmjs.com/package/blo"><img src="https://img.shields.io/npm/v/blo?colorB=007ec6" alt="npm version"></a> <a href="https://bundlejs.com/?q=blo"><img src="https://deno.bundlejs.com/badge?q=blo" alt="Bundle size"></a> <a href="https://github.com/bpierre/blo/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/blo?colorB=007ec6" alt="License: MIT"></a></p>

## Features

- 🐥 **Small**: **[0.7 kB](https://bundlejs.com/?bundle&q=blo)** gzipped, even less with tree shaking.
- 💥 **Fast**: **[more than 5x faster](#benchmark)** than the second fastest solution.
- 🔍 **Optimized**: Leverages SVG to generate compact and sharp images at any size.
- 💆 **Simple**: Focuses on Ethereum identicons only, allowing for a simpler API.
- 🗂 **Typed**: Ships with [TypeScript definitions](#types).
- 👫 **Universal**: Compatible with browsers, [Bun](https://bun.sh/), and [Node.js](http://nodejs.org/).
- ☁️ **Standalone**: Zero dependencies.

## Library Comparison

| Library                               | Operations/sec[^1] | Size                                                                                                       | Types                                        | Environment[^2]                                | Rendering |
| ------------------------------------- | -----------------: | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------- | --------: |
| <b>blo</b>                            |         💥 403,226 | [![](https://img.shields.io/badge/0.70kB-6ead0a)](https://bundlejs.com/?bundle&q=blo)                      | ![](https://img.shields.io/badge/yes-6ead0a) | ![](https://img.shields.io/badge/all-6ead0a)   |       SVG |
| <nobr>ethereum-blockies-base64</nobr> |              2,191 | [![](https://img.shields.io/badge/2.75kB-ee4433)](https://bundlejs.com/?bundle&q=ethereum-blockies-base64) | ![](https://img.shields.io/badge/no-ee4433)  | ![](https://img.shields.io/badge/all-6ead0a)   |       PNG |
| <nobr>blockies-react-svg</nobr>       |             76,628 | [![](https://img.shields.io/badge/4.00kB-ee4433)](https://bundlejs.com/?bundle&q=blockies-react-svg)       | ![](https://img.shields.io/badge/yes-6ead0a) | ![](https://img.shields.io/badge/react-ee4433) |       SVG |
| <nobr>@download/blockies</nobr>       |                112 | [![](https://img.shields.io/badge/0.67kB-6ead0a)](https://bundlejs.com/?bundle&q=%6ead0a%2Fblockies)       | ![](https://img.shields.io/badge/no-ee4433)  | ![](https://img.shields.io/badge/dom-ee4433)   |    Canvas |
| <nobr>blockies-ts</nobr>              |                137 | [![](https://img.shields.io/badge/1.31kB-6ead0a)](https://bundlejs.com/?bundle&q=blockies-ts)              | ![](https://img.shields.io/badge/yes-6ead0a) | ![](https://img.shields.io/badge/dom-ee4433)   |    Canvas |
| <nobr>react-blockies</nobr>           |              4,693 | [![](https://img.shields.io/badge/4.72kB-ee4433)](https://bundlejs.com/?bundle&q=react-blockies)           | ![](https://img.shields.io/badge/no-ee4433)  | ![](https://img.shields.io/badge/react-ee4433) |    Canvas |

[^1]: These numbers are based on the [#benchmark](#benchmark) results (higher is better).
[^2]: The term “all” refers to libraries that are framework agnostic and that run in browsers, Bun and Node.js.

## Getting Started

```sh
npm i -S blo
pnpm add blo
yarn add blo
```

```ts
import { blo } from "blo";

img.src = blo("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
```

### React / Vue / Others

blo is fast enough to not require memoization or async rendering for common use cases.

```tsx
function AddressIcon({ address }: { address: `0x${string}` }) {
  return (
    <img
      alt={address}
      src={blo(address)}
    />
  );
}
```

## API

<details>
<summary><b><code>blo(address: Address, size = 64): string</code></b></summary>
<br>

Get a data URI string representing the identicon as an SVG image.

The `size` paramater shouldn’t usually be needed, as the image will stay sharp no matter what the size of the `img` element is.

Example:

```ts
import { blo } from "blo";

img.src = blo(address); // size inside the SVG defaults to 64px
img2.src = blo(address, 24); // set it to 24px
```

</details>

<details>
<summary><b><code>bloSvg(address: Address, size = 64): string</code></b></summary>
<br>

Same as above except it returns the SVG code instead of a data URI string.

</details>

<details>
<summary><b><code>bloImage(address: Address): BloImage</code></b></summary>
<br>

Get a `BloImage` data structure that can be used to render the image in different formats.

Check the [Bun](./demos/bun/index.ts) and [Node](./demos/node/index.js) demos to see usage examples.

</details>

## Types

The library ships with TypeScript types included.

```ts
// BloImage contains the data needed to render an icon.
export type BloImage = [BloImageData, Palette];

// 4x8 grid of the image left side, as 32 PaletteIndex items.
// The right side is omitted as it's a mirror of the left side.
export type BloImageData = Uint8Array;

// Colors used by a given icon.
export type Palette = [
  Hsl, // background
  Hsl, // color
  Hsl, // spot
];

// Points to one of the three Palette colors.
export type PaletteIndex =
  | 0 // background
  | 1 // color
  | 2; // spot

// A color in the HSL color space.
// [0]: 0-360 (hue)
// [1]: 0-100 (saturation)
// [2]: 0-100 (lightness)
export type Hsl = Uint16Array;

// An Ethereum address.
export type Address = `0x${string}`;
```

## Acknowledgements

- blo is a modernized version of [ethereum-blockies-base64](https://github.com/MyCryptoHQ/ethereum-blockies-base64), which I think was based on [ethereum/blockies](https://github.com/ethereum/blockies).
- This README style was heavily inspired by [colord](https://github.com/omgovich/colord).
- The visual was made in collaboration with [@dizzypaty](https://twitter.com/dizzypaty) 💖.

## FAQ

### Does it follow the exact same algorithm as Etherscan, MetaMask and others?

Yes.

### Does it work with ENS names?

No it only works with Ethereum addresses, but you can resolve the ENS name to an address (e.g. with [wagmi](https://wagmi.sh/core/actions/fetchEnsAddress)) and pass the result to blo.

### Can blo render other formats than SVG?

You can render to any format you want by using the `bloImage()` function, which returns a data structure (see [API](#api) above). Check out the [Bun](./demos/bun) and [Node](./demos/node) demos for examples of rendering an identicon in the terminal.

<img width="400" src="https://github.com/bpierre/blo/assets/36158/a7c86d01-f003-49d7-8f9e-93097b502872" alt="Ethereum identicon rendered in the terminal">

### Can it be used to generate other types of identicons?

blo only focuses on the Ethereum identicons algorithm but you can use it with any data, just prefix it with `0x` to fulfill the expected `Address` type if you are using TypeScript.

### Why is it named blo?

blo is short for blockies, which is the name of [the original library](https://github.com/ethereum/blockies) it is based on.

## Benchmark

This benchmark attempts to use the fastest possible way to generate a data URI representing an Ethereum identicon, for each of the libraries compared.

```
$ bun benchmark

clk: ~2.39 GHz
cpu: AMD Ryzen 7 PRO 7840U w/ Radeon 780M Graphics
runtime: bun 1.2.5 (x64-linux)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
blo                            2.48 µs/iter   2.55 µs   3.13 µs ▅▆█▃▃▂▁▁▁▁▁
@download/blockies             8.95 ms/iter   9.17 ms  10.63 ms █▇▃▄▂▂▂▂▂▁▁
blockies-react-svg            13.05 µs/iter  14.39 µs  14.53 µs █▃▆▁▁▁▁▁▁▃▃
blockies-ts                    7.28 ms/iter   7.41 ms   8.48 ms █▆▂▂▁▂▂▃▁▁▁
ethereum-blockies-base64     456.49 µs/iter 501.59 µs 882.05 µs ▆█▄▄▂▃▂▂▁▁▁
react-blockies               213.03 µs/iter 220.64 µs 268.34 µs ▁▃▆██▆▃▂▂▁▁

summary
  blo
   5.26x faster than blockies-react-svg
   85.78x faster than react-blockies
   183.82x faster than ethereum-blockies-base64
   2929.86x faster than blockies-ts
   3603.5x faster than @download/blockies
```

See [./benchmark](./benchmark) for the benchmark code.

## License

[MIT](./LICENSE)
