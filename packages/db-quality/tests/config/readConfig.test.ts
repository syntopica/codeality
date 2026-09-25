import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { ConfigError } from '@/config/ConfigError.js'
import { readConfig } from '@/config/readConfig.js'

describe('readConfig', () => {
  it('reads codeality-db.json from the root', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(
      join(root, 'codeality-db.json'),
      '{"schemaVersion":1,"sqlite":{"files":["a.db"]}}',
    )
    expect(readConfig(root).sqlite).toEqual({ files: ['a.db'] })
  })
  it('names the missing file', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    expect(() => readConfig(root)).toThrow(ConfigError)
    expect(() => readConfig(root)).toThrow(/codeality-db.json not found/)
  })
  it('reports invalid JSON', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(join(root, 'codeality-db.json'), '{oops')
    expect(() => readConfig(root)).toThrow(/not valid JSON/)
  })
})
