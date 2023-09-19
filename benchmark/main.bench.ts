import makeBlockiesUrl from "blockies-react-svg/dist/es/makeBlockiesUrl.mjs";
import makeBlockie from "ethereum-blockies-base64";
import Rand from "rand-seed";
import { bench } from "vitest";
import { blo } from "../src";

let rand: Rand;

function address(): `0x${string}` {
  return `0x${
    Array.from({ length: 40 }).map(() => (
      Math.floor(rand.next() * 16).toString(16)
    )).join("")
  }`;
}

const benchOptions = {
  setup() {
    rand = new Rand("1234");
  },
};

bench("blo", () => {
  blo(address());
}, benchOptions);

bench("ethereum-blockies-base64", () => {
  makeBlockie(address());
}, benchOptions);

bench("blockies-react-svg", () => {
  makeBlockiesUrl(address(), 8, false, 8);
}, benchOptions);
