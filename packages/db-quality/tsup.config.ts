import path from 'node:path'

import { defineConfig } from 'tsup'

// One ESM bundle. The CLI exports nothing, so no declarations are emitted.
export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  minify: false,
  target: 'node22',
  esbuildOptions(options) {
    options.alias = { '@': path.resolve(import.meta.dirname, 'src') }
  },
})
