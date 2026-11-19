import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: true, port: 5173 },
  // The PDF engine (react-pdf) is one big lazy-loaded chunk by nature; it's fetched in the background after first paint.
  build: { chunkSizeWarningLimit: 1600 },
});
