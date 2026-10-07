import path from 'node:path'

import { defineConfig } from 'tsup'

// ESM bundles, no declarations: the CLI, plus the two entries the assets load
// at run time in another process (the Kysely ESLint rules and the Kysely
// migration compiler). Shared code goes to chunks beside them.
export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
    kyselyEslintPlugin: 'src/eslint/kysely/kyselyEslintPlugin.ts',
    kyselyCompileMain: 'src/adapters/kysely/kyselyCompileMain.ts',
  },
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
