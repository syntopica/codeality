import { describe, expect, it } from 'vitest'

import { isExemptEntryFilename } from '@/utils/is-exempt-entry-filename.js'

describe('isExemptEntryFilename', () => {
  it.each([
    'vite.config.ts',
    'eslint.config.js',
    'app.config.mjs',
    'tailwind.config.cjs',
    'globals.d.ts',
    'src/index.ts',
    'src/components/index.tsx',
    'lib/index.js',
  ])('returns true for %s', (filename) => {
    expect(isExemptEntryFilename(filename)).toBe(true)
  })

  it.each(['src/formatDate.ts', 'src/UserCard.tsx', 'proxy.ts', 'indexer.ts'])(
    'returns false for %s',
    (filename) => {
      expect(isExemptEntryFilename(filename)).toBe(false)
    },
  )
})
