import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import svgr from "vite-plugin-svgr";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [svgr(), react(), crx({ manifest })],
  build: {
    rollupOptions: {
      external: [/^core-js\/.*/, /^canvg/, /^html2canvas/, /^dompurify/],
    },
  },
});
