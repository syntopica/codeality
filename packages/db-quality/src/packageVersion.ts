import { createRequire } from 'node:module'

// Read at runtime from the package's own manifest so the bundle never carries
// a copy that drifts from `package.json`. Both `dist/cli.js` and `src/` sit
// one level below the package root.
export const PACKAGE_VERSION: string = (
  createRequire(import.meta.url)('../package.json') as { version: string }
).version
