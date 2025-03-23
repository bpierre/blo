import Rand from "rand-seed";
import { bench } from "vitest";
import { blo } from "../src/index.js";

import { createIcon as blockies_createIcon } from "@download/blockies";
import blockiesReactSvg_makeBlockiesUrl from "blockies-react-svg/dist/es/makeBlockiesUrl.mjs";
import { create as blockiesTs_create } from "blockies-ts";
import ethereumBlockiesBase64_makeBlockie from "ethereum-blockies-base64";
import ReactBlockies_Identicon from "react-blockies";
import { canvasPolyfill } from "./canvas-polyfill.js";

canvasPolyfill(globalThis);

let rand: Rand;

function address(): `0x${string}` {
  return `0x${
    Array.from({ length: 40 }).map(() => (
      Math.floor(rand.next() * 16).toString(16)
    )).join("")
  }`;
}

const benchmark = {
  "blo": () => blo(address()),
  "ethereum-blockies-base64": () => (
    ethereumBlockiesBase64_makeBlockie(address())
  ),
  "blockies-react-svg": () => (
    blockiesReactSvg_makeBlockiesUrl(address(), 8, false, 64)
  ),
  "@download/blockies": () => (
    blockies_createIcon({
      seed: address().toLowerCase(),
      scale: 8,
      size: 64,
    }).toDataURL()
  ),
  "blockies-ts": () => (
    blockiesTs_create({
      seed: address().toLowerCase(),
      size: 8,
      scale: 64,
    }).toDataURL()
  ),
  "react-blockies": () => {
    const canvas = document.createElement("canvas");
    const { generateIdenticon } = ReactBlockies_Identicon.prototype;
    generateIdenticon.call({
      identicon: {
        getContext: canvas.getContext.bind(canvas),
        style: {},
      },
    }, {
      seed: address().toLowerCase(),
      size: 8,
      scale: 64,
    });
    return canvas.toDataURL();
  },
};

Object.entries(benchmark).forEach(([name, fn]) => {
  bench(
    name,
    async () => {
      await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = resolve;
        image.onerror = reject;
        image.src = fn();
      });
    },
    {
      setup: () => {
        rand = new Rand("1234");
      },
      throws: true,
      iterations: 100,
    },
  );
});
