import { createIcon } from "@download/blockies";
import makeBlockiesUrl from "blockies-react-svg/dist/es/makeBlockiesUrl.mjs";
import { create } from "blockies-ts";
import makeBlockie from "ethereum-blockies-base64";
import ReactBlockies from "react-blockies";

export { blo } from "../../dist/esm/index.js";
export * as wasm from "../../dist/esm/wasm.js";
export {
  calibrate,
  measureSample,
  SAMPLE_TARGET_MS,
  samplePlan,
} from "./runner.mjs";

// The legacy CommonJS package exposes its component under `default` when
// imported from an ES module. Support both package interop shapes.
const Identicon = ReactBlockies.default ?? ReactBlockies;

// 8×8 icons at 128 raster pixels, displayed at 64×64 as in the original page.
// Call React's generator directly, like the existing CLI benchmark.
export const libraries = {
  "ethereum-blockies-base64": (address) => makeBlockie(address.toLowerCase()),
  "blockies-react-svg": (address) => makeBlockiesUrl(address, 8, false, 16),
  "@download/blockies": (address) =>
    createIcon({
      seed: address.toLowerCase(),
      size: 8,
      scale: 16,
    }).toDataURL(),
  "blockies-ts": (address) =>
    create({
      seed: address.toLowerCase(),
      size: 8,
      scale: 16,
    }).toDataURL(),
  "react-blockies": (address) => {
    const canvas = document.createElement("canvas");
    Identicon.prototype.generateIdenticon.call({ identicon: canvas }, {
      seed: address.toLowerCase(),
      size: 8,
      scale: 16,
    });
    return canvas.toDataURL();
  },
};
