import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  build: {
    rollupOptions: {
      // jsPDF optionally imports canvg for SVG support which requires core-js.
      // We don't use SVG export, so we externalize these to avoid the build error.
      external: [
        /^core-js\/.*/,
        /^canvg/,
        /^html2canvas/,
        /^dompurify/,
      ],
    },
  },
});
