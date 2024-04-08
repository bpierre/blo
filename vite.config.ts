import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig(({ mode }) => ({
  build: {
    target: ["es2020", "esnext"],
    outDir: "dist",
    lib: {
      entry: "src/index.ts",
      formats: ["es", "cjs"],
      fileName: (format, entryName) => (
        format === "es"
          ? `${entryName}.js`
          : `${entryName}.${format}`
      ),
    },
    sourcemap: mode === "production" || "inline",
  },
  optimizeDeps: {
    entries: ["src/index.ts"],
  },
  plugins: [
    dts({ insertTypesEntry: true }),
  ],
}));
