import { defineConfig } from 'vitest/config';
import pkg from './package.json' with { type: 'json' };

// GitHub Pages serves this project at https://shay-meredith.github.io/Colony-Seed/.
// The same (case-sensitive) base is used for dev, build and preview so local URLs
// mirror production exactly.
const PAGES_BASE = '/Colony-Seed/';

export default defineConfig({
  base: PAGES_BASE,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: { host: true },
  preview: { host: true },
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
  test: {
    environment: 'node',
  },
});
