import { resolve } from 'node:path'
import type { EsbuildAliasOptions } from './EsbuildAliasOptions.js'

/**
 * The tsup options of a gate CLI: one ESM bundle of `src/cli.ts` for node 22,
 * with the `@/` alias resolved to the package's `src/`. The CLI exports
 * nothing, so no declarations are emitted.
 */
export const cliTsupOptions = (packageDir: string) => ({
  entry: ['src/cli.ts'],
  format: ['esm' as const],
  dts: false,
  clean: true,
  sourcemap: true,
  minify: false,
  target: 'node22',
  esbuildOptions(options: EsbuildAliasOptions): void {
    options.alias = { '@': resolve(packageDir, 'src') }
  },
})
