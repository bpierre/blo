import { execFileSync } from "node:child_process";
import {
  closeSync,
  copyFileSync,
  mkdirSync,
  openSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { fileURLToPath } from "node:url";

// Keep performance/parity comparisons anchored to the released implementation
// even after the working sources change.
const directory = fileURLToPath(new URL("dist/", import.meta.url));
const files = [
  ...["index", "image", "svg", "random", "types", "wasm", "wasm/adapter"].map(
    (name) => `src/${name}.ts`,
  ),
  "experimental/wasm/src/lib.rs",
  "experimental/wasm/Cargo.toml",
  "experimental/wasm/Cargo.lock",
];
for (const file of files) {
  const destination = new URL(`dist/source/${file}`, import.meta.url);
  mkdirSync(new URL(".", destination), { recursive: true });
  const fd = openSync(destination, "w");
  try {
    execFileSync("git", ["show", `v2.1.0:${file}`], {
      stdio: ["ignore", fd, "inherit"],
    });
  } finally {
    closeSync(fd);
  }
}
execFileSync("cargo", [
  "build",
  "--release",
  "--offline",
  "--target",
  "wasm32-unknown-unknown",
  "--target-dir",
  directory + "target",
], {
  cwd: directory + "source/experimental/wasm",
  stdio: "inherit",
});
copyFileSync(
  directory + "target/wasm32-unknown-unknown/release/blo_wasm.wasm",
  directory + "blo.wasm",
);
writeFileSync(
  directory + "source/src/wasm/bytes.ts",
  `export const base64 = ${
    JSON.stringify(readFileSync(directory + "blo.wasm").toString("base64"))
  };\n`,
);
execFileSync(process.execPath, [
  "node_modules/typescript/bin/tsc",
  "--target",
  "ES2021",
  "--module",
  "ES2022",
  "--moduleResolution",
  "Bundler",
  "--skipLibCheck",
  "--rootDir",
  directory + "source/src",
  "--outDir",
  directory + "esm",
  directory + "source/src/index.ts",
  directory + "source/src/wasm.ts",
], { stdio: "inherit" });
writeFileSync(directory + "esm/package.json", "{\"type\":\"module\"}\n");
console.log("blo 2.1.0 reference built.");
