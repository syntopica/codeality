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
    'lib/index.mjs',
    'src/index.mts',
    'src\\win\\index.ts',
    'types/env.d.mts',
    'vitest.config.mts',
  ])('returns true for %s', (filename) => {
    expect(isExemptEntryFilename(filename)).toBe(true)
  })

  it.each([
    'src/formatDate.ts',
    'src/UserCard.tsx',
    'proxy.ts',
    'indexer.ts',
    'src/reindex.js',
    'src/myindex.ts',
    'src/index.test.ts',
  ])('returns false for %s', (filename) => {
    expect(isExemptEntryFilename(filename)).toBe(false)
  })
})
