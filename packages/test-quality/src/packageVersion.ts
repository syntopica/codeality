import type { PackageManifest } from '@/PackageManifest.js'
import { createRequire } from 'node:module'

// Read at runtime from the package's own manifest so the bundle never carries
// a copy that drifts from `package.json`. `dist/cli.js` sits one level below
// the package root; the source is only read through tests, which mock it.
export const PACKAGE_VERSION: string = (
  createRequire(import.meta.url)('../package.json') as PackageManifest
).version
