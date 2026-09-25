import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { detectStacks } from '@/config/detectStacks.js'

const SRC = 'src'
const SRC_INDEX_TS = 'src/index.ts'
const PACKAGE_JSON = 'package.json'
const SUPABASE_JS_PACKAGE_JSON = JSON.stringify({
  dependencies: { '@supabase/supabase-js': '^2' },
})

describe('detectStacks', () => {
  it('detects every stack it knows', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'supabase/migrations'), { recursive: true })
    mkdirSync(join(root, 'prisma'))
    writeFileSync(join(root, 'prisma/schema.prisma'), '')
    writeFileSync(join(root, 'drizzle.config.ts'), '')
    mkdirSync(join(root, SRC))
    mkdirSync(join(root, 'data'))
    writeFileSync(join(root, 'data/app.db'), '')
    mkdirSync(join(root, 'node_modules/x'), { recursive: true })
    writeFileSync(join(root, 'node_modules/x/ignored.db'), '')
    mkdirSync(join(root, '.pnpm-store/v11'), { recursive: true })
    writeFileSync(join(root, '.pnpm-store/v11/index.db'), '')
    mkdirSync(join(root, 'deep/er/still'), { recursive: true })
    writeFileSync(join(root, 'deep/er/still/too-deep.db'), '')
    expect(detectStacks(root)).toEqual({
      supabase: { migrations: 'supabase/migrations' },
      prisma: { schema: 'prisma/schema.prisma' },
      drizzle: { roots: [SRC], objectNames: ['db', 'tx'] },
      sqlite: { files: ['data/app.db'] },
    })
  })
  it('returns nothing for an empty directory', () => {
    expect(detectStacks(mkdtempSync(join(tmpdir(), 'dbq-')))).toEqual({})
  })
  it('detects postgrest when @supabase/supabase-js is a dependency', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(join(root, PACKAGE_JSON), SUPABASE_JS_PACKAGE_JSON)
    mkdirSync(join(root, SRC))
    writeFileSync(join(root, SRC_INDEX_TS), '')
    mkdirSync(join(root, 'app'))
    writeFileSync(join(root, 'app/route.ts'), '')
    expect(detectStacks(root).postgrest).toEqual({ roots: [SRC, 'app'] })
  })
  it('does not detect postgrest without the dependency', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(join(root, PACKAGE_JSON), JSON.stringify({}))
    mkdirSync(join(root, SRC))
    writeFileSync(join(root, SRC_INDEX_TS), '')
    expect(detectStacks(root).postgrest).toBeUndefined()
  })
  it('excludes a postgrest root that holds no TypeScript source', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(join(root, PACKAGE_JSON), SUPABASE_JS_PACKAGE_JSON)
    mkdirSync(join(root, SRC))
    writeFileSync(join(root, SRC_INDEX_TS), '')
    mkdirSync(join(root, 'supabase/functions'), { recursive: true })
    writeFileSync(join(root, 'supabase/functions/.DS_Store'), '')
    expect(detectStacks(root).postgrest).toEqual({ roots: [SRC] })
  })
  it('excludes a postgrest root whose only file is a test', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(join(root, PACKAGE_JSON), SUPABASE_JS_PACKAGE_JSON)
    mkdirSync(join(root, SRC))
    writeFileSync(join(root, SRC_INDEX_TS), '')
    mkdirSync(join(root, 'supabase/functions'), { recursive: true })
    writeFileSync(join(root, 'supabase/functions/foo.test.ts'), '')
    expect(detectStacks(root).postgrest).toEqual({ roots: [SRC] })
  })
  it('does not detect postgrest when no candidate root holds a source file', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(join(root, PACKAGE_JSON), SUPABASE_JS_PACKAGE_JSON)
    mkdirSync(join(root, SRC))
    writeFileSync(join(root, 'src/README.md'), '')
    expect(detectStacks(root).postgrest).toBeUndefined()
  })
})
