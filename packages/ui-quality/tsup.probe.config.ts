import { defineConfig } from 'tsup'

import { PROBE_BUNDLE_NAME } from './src/capture/PROBE_BUNDLE_NAME.js'

/** The browser probe is independent of the Node CLI bundle. */
export default defineConfig({
  entry: { probe: 'assets/probe.js' },
  format: ['iife'],
  globalName: PROBE_BUNDLE_NAME,
  platform: 'browser',
  outDir: 'assets/generated',
  bundle: true,
  noExternal: [/.*/],
  splitting: false,
  dts: false,
  clean: true,
  sourcemap: false,
  minify: false,
  target: 'es2022',
})
