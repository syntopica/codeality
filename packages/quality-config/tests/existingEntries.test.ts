import { describe, expect, it } from 'vitest'

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { existingEntries } from '../src/existingEntries'

describe('existingEntries', () => {
  it('drops a literal path that does not exist and keeps globs', () => {
    const dir = mkdtempSync(join(tmpdir(), 'qc-entries-'))
    expect(existingEntries(['src/index.ts', 'src/pages/**/*.ts'], dir)).toEqual(
      ['src/pages/**/*.ts'],
    )
  })

  it('keeps a literal path that exists', () => {
    const dir = mkdtempSync(join(tmpdir(), 'qc-entries-'))
    mkdirSync(join(dir, 'src'))
    writeFileSync(join(dir, 'src/index.ts'), '')
    expect(existingEntries(['src/index.ts'], dir)).toEqual(['src/index.ts'])
  })
})
