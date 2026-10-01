import { readFileSync } from 'node:fs'

import { assetPath } from '@/assetPath.js'

// Prettier guards the file's leading arrow function with a `;`, which would
// break the `(source)(argument)` call it is wrapped in.
export const probeSource = (): string =>
  readFileSync(assetPath('probe.js'), 'utf8').trim().replace(/^;/m, '')
