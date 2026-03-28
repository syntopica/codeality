import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/configs/recommended.ts',
    'src/configs/strict.ts',
    'src/configs/react.ts',
    'src/configs/next.ts',
  ],
  format: ['cjs', 'esm'],
  // DTS is emitted separately by tsc to avoid tsup's internal baseUrl injection
  // which breaks under TypeScript 6. See package.json "build" script.
  dts: false,
  clean: true,
  treeshake: true,
  splitting: true,
  sourcemap: true,
  minify: false,
})
