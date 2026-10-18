import { resolve } from "node:path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  main: {
    build: {
      rollupOptions: { input: { index: resolve("electron/main/index.ts") } },
    },
  },
  preload: {
    build: {
      rollupOptions: {
        input: { index: resolve("electron/preload/index.ts") },
        // Sandboxed preload scripts must be CommonJS.
        output: { format: "cjs", entryFileNames: "[name].cjs" },
      },
    },
  },
  renderer: {
    root: ".",
    build: {
      rollupOptions: { input: { index: resolve("index.html") } },
    },
    plugins: [react(), tailwindcss()],
  },
});
