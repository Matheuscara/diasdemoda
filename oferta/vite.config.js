import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [tailwindcss()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 4096,
  },
  server: {
    port: 5190,
    host: '127.0.0.1',
  },
});
