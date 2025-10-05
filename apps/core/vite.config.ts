import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@loadmaster/engine": path.resolve(__dirname, "../../packages/engine/src"),
    },
  },
  build: {
    outDir: "../../dist/core",
  },
});