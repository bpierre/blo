import { execFileSync } from "node:child_process";
import { defineConfig } from "vite";

function modulePath(format: string, path: string) {
  return (format === "es" ? "esm" : "cjs") + "/" + path;
}

export default defineConfig({
  build: {
    target: ["es2021", "esnext"],
    outDir: "dist",
    lib: {
      entry: { index: "src/index.ts", wasm: "src/wasm.ts" },
      formats: ["es", "cjs"],
      fileName: (format, name) => modulePath(format, `${name}.js`),
    },
    sourcemap: true,
    rollupOptions: {
      output: { preserveModules: true },
    },
    minify: false,
  },
  plugins: [
    {
      name: "emit-package-json",
      generateBundle({ format }) {
        this.emitFile({
          type: "asset",
          fileName: modulePath(format, "package.json"),
          source: JSON.stringify({
            type: format === "es" ? "module" : "commonjs",
            sideEffects: false,
          }),
        });
      },
    },
    {
      name: "emit-types",
      closeBundle() {
        execFileSync(process.execPath, [
          "node_modules/typescript/bin/tsc",
          "--rootDir",
          "./src",
          "--emitDeclarationOnly",
          "--declaration",
          "--declarationMap",
          "--declarationDir",
          "./dist/types",
        ], { stdio: "inherit" });
        console.log(
          `\x1b[32m✓\x1b[0m declaration files emitted to ./dist/types.`,
        );
      },
    },
  ],
});
