import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // caminhos relativos: o build roda em qualquer subpasta de qualquer host estático
  base: './',
  plugins: [tailwindcss()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 4096,
  },
  server: {
    port: 5180,
    host: '127.0.0.1',
  },
});
