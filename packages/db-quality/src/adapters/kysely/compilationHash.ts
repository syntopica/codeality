import { createHash } from 'node:crypto'

import type { DialectCompilation } from '@/adapters/kysely/DialectCompilation.js'

// The compiled SQL, not the TypeScript: reformatting the source never changes
// it, changing what runs always does.
export const compilationHash = (compilation: DialectCompilation): string =>
  createHash('sha256')
    .update(
      JSON.stringify([compilation.up, compilation.down, compilation.error]),
    )
    .digest('hex')
