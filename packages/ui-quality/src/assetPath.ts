import { fileURLToPath } from 'node:url'

// `assets/` is one level up from both `dist/cli.js` (the bundle) and `src/`.
export const assetPath = (name: string): string =>
  fileURLToPath(new URL(`../assets/${name}`, import.meta.url))
