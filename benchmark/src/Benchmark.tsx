import type { BenchmarkRef, BenchResultsType } from "react-component-benchmark";

import { createIcon as blockiesCreateIcon } from "@download/blockies";
import BlockiesSvgSync from "blockies-react-svg/dist/es/BlockiesSvgSync.mjs";
import * as blockiesTs from "blockies-ts";
import makeBlockie from "ethereum-blockies-base64";
import { useRef, useState } from "react";
import ReactBlockies from "react-blockies";
import { Benchmark } from "react-component-benchmark";
import { blo } from "../../src";

const SAMPLES = 1000;

const randomAddress = () => {
  return `0x${
    Array.from({ length: 40 }).map(() => {
      const char = Math.floor(Math.random() * 16).toString(16);
      return Math.random() > 0.5 ? char : char.toUpperCase();
    }).join("")
  }`;
};

const addresses = Array.from({ length: SAMPLES * 10 }).map(randomAddress);

let i = 0;
function nextAddress() {
  return addresses[i = (i + 1) % SAMPLES] as `0x${string}`;
}

// All benchmarks are rendering a 64x64 image on a @2x display,
// which requires to render the raster images at 128x128.
const BENCHMARKS: Record<
  string,
  ({ address }: { address: `0x${string}` }) => JSX.Element
> = {
  "blo": ({ address }) => (
    <img
      width={64}
      height={64}
      src={blo(address)}
    />
  ),
  "ethereum-blockies-base64": ({ address }) => (
    <img
      width={64}
      height={64}
      src={makeBlockie(address)}
    />
  ),
  "blockies-react-svg": ({ address }) => (
    <BlockiesSvgSync
      size={8}
      scale={8}
      address={address}
    />
  ),
  "@download/blockies": ({ address }) => (
    <img
      width={64}
      height={64}
      src={blockiesCreateIcon({
        seed: address.toLowerCase(),
        scale: 16,
        size: 8,
      }).toDataURL()}
    />
  ),
  "blockies-ts": ({ address }) => (
    <img
      width={64}
      height={64}
      src={blockiesTs.create({
        seed: address.toLowerCase(),
        scale: 16,
        size: 8,
      }).toDataURL()}
    />
  ),
  "react-blockies": ({ address }) => (
    // className is used to force the display size to 64x64
    <ReactBlockies
      className="react-blockies"
      seed={address.toLowerCase()}
      scale={16}
      size={8}
    />
  ),
} as const;

export default function App() {
  const [results, setResults] = useState<
    Record<
      keyof typeof BENCHMARKS,
      | null
      | BenchResultsType & { rps: number }
    >
  >(
    Object.fromEntries(
      Object.keys(BENCHMARKS).map((key) => [key, null]),
    ) as Record<keyof typeof BENCHMARKS, null>,
  );

  const refs = Object.fromEntries(
    Object.keys(BENCHMARKS).map((name) => [
      name,
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useRef<BenchmarkRef | null>(null),
    ]),
  );

  const [running, setRunning] = useState<null | keyof typeof BENCHMARKS>(null);

  const best = Object.values(results).reduce((best, result) => (
    Math.max(result?.rps ?? 0, best)
  ), 0);

  return (
    <>
      <style>{STYLES}</style>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Library</th>
            <th colSpan={3}>Renders / sec</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(BENCHMARKS).map((benchmark) => {
            const [name, Component] = benchmark;
            const score = best ? (results[name]?.rps ?? 0) / best : 0;
            return (
              <tr key={name}>
                <td
                  align="right"
                  valign="middle"
                  style={{ minWidth: "100px" }}
                >
                  <div
                    style={{
                      width: `${score * 100}px`,
                      height: "8px",

                      // 120 = green, 0 = red
                      background: `hsl(${Math.round(score * 120)}, 50%, 70%)`,
                    }}
                  />
                </td>
                <td>
                  {name}
                </td>
                <td
                  style={{
                    minWidth: "100px",
                  }}
                >
                  {results[name]?.mean
                    ? new Intl.NumberFormat("EN-us").format(
                      Math.round(results[name]?.rps ?? 0),
                    )
                    : "-"}
                </td>
                <td>
                  <button
                    disabled={running !== null}
                    onClick={() => {
                      if (!running) {
                        refs[name].current?.start();
                        setRunning(name);
                      }
                    }}
                  >
                    Run
                  </button>
                </td>
                <td>
                  <div className="render-zone">
                    <div className="benchmark">
                      <Benchmark
                        ref={refs[name]}
                        component={() => <Component address={nextAddress()} />}
                        onComplete={(result) => {
                          setResults((r) => ({
                            ...r,
                            [name]: { ...result, rps: 1000 / result.mean },
                          }));
                          setRunning(null);
                        }}
                        samples={SAMPLES}
                        type="mount"
                      />
                    </div>
                    <div className="sample">
                      <Component address="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" />
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

const STYLES = `
  body {
    font-family: sans-serif;
    padding-top: 40px;
  }
  table {
    margin: 0 auto;
    border-collapse: collapse;
    border-spacing: 0;
  }
  th {
    text-align: left;
    padding: 10px 20px;
  }
  td {
    padding: 10px 20px;
  }
  .render-zone {
    display: flex;
    gap: 20px;
  }
  .render-zone div {
    position: relative;
    contain: strict;
    width: 64px;
    height: 64px;
    outline: 2px solid #000;
  }

  .render-zone img,
  .render-zone svg,
  .render-zone canvas {
    position: absolute;
    inset: 0;
  }

  .react-blockies {
    width: 64px !important;
    height: 64px !important;
  }
`;
