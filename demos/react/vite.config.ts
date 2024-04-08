import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  build: {
    target: ["es2020", "esnext"],
    outDir: "dist",
    sourcemap: mode === "production" || "inline",
  },
  plugins: [react()],
}));
