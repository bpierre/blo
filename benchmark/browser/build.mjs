import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(new URL("../package.json", import.meta.url));
let build;
try {
  ({ build } = require("esbuild"));
} catch {
  throw new Error(
    "Install benchmark dependencies first: pnpm --dir benchmark install",
  );
}
await build({
  entryPoints: [fileURLToPath(new URL("libraries.mjs", import.meta.url))],
  outfile: fileURLToPath(new URL("dist/libraries.mjs", import.meta.url)),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2021",
  define: { "process.env.NODE_ENV": "\"production\"" },
  minify: true,
  legalComments: "eof",
});
console.log("Browser comparison libraries bundled.");
