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
  dts: true,
  clean: true,
  treeshake: true,
  splitting: true,
  sourcemap: true,
  minify: false,
})
