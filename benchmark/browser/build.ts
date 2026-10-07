import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(new URL("../package.json", import.meta.url));
let build: typeof import("esbuild").build;
try {
  ({ build } = require("esbuild"));
} catch {
  throw new Error(
    "Install benchmark dependencies first: pnpm --dir benchmark install",
  );
}
await build({
  entryPoints: [fileURLToPath(new URL("libraries.ts", import.meta.url))],
  outfile: fileURLToPath(new URL("dist/libraries.js", import.meta.url)),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2021",
  define: { "process.env.NODE_ENV": "\"production\"" },
  minify: true,
  legalComments: "eof",
  // Resolve the current built package, rather than benchmark/node_modules/blo.
  alias: {
    "blo": fileURLToPath(new URL("../../dist/esm/index.js", import.meta.url)),
    "blo/wasm": fileURLToPath(new URL("../../dist/esm/wasm.js", import.meta.url)),
  },
});
await build({
  entryPoints: {
    app: fileURLToPath(new URL("app.ts", import.meta.url)),
    "wasm/fixtures": fileURLToPath(
      new URL("../../experimental/wasm/fixtures.ts", import.meta.url),
    ),
    "wasm/measure": fileURLToPath(
      new URL("../../experimental/wasm/measure.ts", import.meta.url),
    ),
  },
  outdir: fileURLToPath(new URL("dist/", import.meta.url)),
  bundle: false,
  format: "esm",
  platform: "browser",
  target: "es2021",
});
console.log("Browser comparison libraries and TypeScript scripts built.");
