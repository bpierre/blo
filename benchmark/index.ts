import { bench, compact, run, summary } from "mitata";

import { createIcon as blockies_createIcon } from "@download/blockies";
import { blo } from "blo";
import blockiesReactSvg_makeBlockiesUrl from "blockies-react-svg/dist/es/makeBlockiesUrl.mjs";
import { create as blockiesTs_create } from "blockies-ts";
import ethereumBlockiesBase64_makeBlockie from "ethereum-blockies-base64";
import ReactBlockies_Identicon from "react-blockies";
import { canvasPolyfill } from "./canvas-polyfill.js";

canvasPolyfill(globalThis);

const benchmark: Record<string, (address: `0x${string}`) => string> = {
  "blo": blo,
  "@download/blockies": (address) => (
    blockies_createIcon({
      seed: address.toLowerCase(),
      scale: 8,
      size: 64,
    }).toDataURL()
  ),
  "blockies-react-svg": (address) => (
    blockiesReactSvg_makeBlockiesUrl(address, 8, false, 64)
  ),
  "blockies-ts": (address) => (
    blockiesTs_create({
      seed: address.toLowerCase(),
      size: 8,
      scale: 64,
    }).toDataURL()
  ),
  "ethereum-blockies-base64": ethereumBlockiesBase64_makeBlockie,
  "react-blockies": (address) => {
    const canvas = document.createElement("canvas");
    const { generateIdenticon } = ReactBlockies_Identicon.prototype;
    generateIdenticon.call({
      identicon: {
        getContext: canvas.getContext.bind(canvas),
        style: {},
      },
    }, {
      seed: address.toLowerCase(),
      size: 8,
      scale: 64,
    });
    return canvas.toDataURL();
  },
};

let currentAddress = BigInt("0x" + "1".repeat(40));
function address(): `0x${string}` {
  return `0x${(currentAddress++).toString(16)}`;
}

compact(() => {
  summary(() => {
    for (const [name, fn] of Object.entries(benchmark)) {
      bench(name, () => fn(address()));
    }
  });
});

await run({
  format: "mitata",
  throw: true,
  colors: true,
});
