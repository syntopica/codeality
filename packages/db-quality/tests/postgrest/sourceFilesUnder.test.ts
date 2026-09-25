import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { ConfigError } from '@/config/ConfigError.js'
import { sourceFilesUnder } from '@/postgrest/sourceFilesUnder.js'

const buildTree = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'dbq-source-'))
  mkdirSync(join(root, 'src/node_modules'), { recursive: true })
  mkdirSync(join(root, 'app'), { recursive: true })
  mkdirSync(join(root, '.hidden'), { recursive: true })
  writeFileSync(join(root, 'src/a.ts'), '')
  writeFileSync(join(root, 'src/a.test.ts'), '')
  writeFileSync(join(root, 'src/types.d.ts'), '')
  writeFileSync(join(root, 'src/node_modules/x.ts'), '')
  writeFileSync(join(root, 'app/b.tsx'), '')
  writeFileSync(join(root, '.hidden/c.ts'), '')
  return root
}

describe('sourceFilesUnder', () => {
  it('walks every root, skipping tests, declarations, node_modules and hidden directories', () => {
    const root = buildTree()
    expect(sourceFilesUnder(root, ['src', 'app'])).toEqual([
      'app/b.tsx',
      'src/a.ts',
    ])
  })
  it('rejects a root that is not a directory', () => {
    const root = buildTree()
    expect(() => sourceFilesUnder(root, ['app', 'missing'])).toThrow(
      ConfigError,
    )
  })
})
