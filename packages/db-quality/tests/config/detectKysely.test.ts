import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { detectStacks } from '@/config/detectStacks.js'
import { inferredKyselyDialects } from '@/config/inferredKyselyDialects.js'
import { kyselyDialectsOf } from '@/config/kyselyDialectsOf.js'
import { kyselyMigrationsNote } from '@/init/kyselyMigrationsNote.js'

const project = (
  dependencies: Record<string, string>,
  files: string[],
): string => {
  const root = mkdtempSync(join(tmpdir(), 'dbq-'))
  writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies }))
  for (const file of files) {
    mkdirSync(join(root, file, '..'), { recursive: true })
    writeFileSync(join(root, file), '')
  }
  return root
}

describe('Kysely detection', () => {
  it('proposes the one migrations module, named after its export', () => {
    const root = project({ kysely: '^0.29' }, [
      'src/db/migrations/migrationList.ts',
      'src/index.ts',
    ])
    const stacks = detectStacks(root)
    expect(stacks.kysely).toEqual({
      roots: ['src'],
      objectNames: ['db', 'trx'],
      migrations: {
        module: 'src/db/migrations/migrationList.ts',
        export: 'migrationList',
        moneyColumns: false,
      },
    })
    expect(kyselyMigrationsNote(stacks)).toBe('')
  })
  it('proposes an index module with the default export name', () => {
    const root = project({ kysely: '^0.29' }, ['db/migrations/index.ts'])
    expect(detectStacks(root).kysely?.migrations).toEqual({
      module: 'db/migrations/index.ts',
      export: 'migrations',
      moneyColumns: false,
    })
  })
  it('leaves the migrations out, and says so, when two modules match', () => {
    const root = project({ kysely: '^0.29' }, [
      'src/migrations/index.ts',
      'server/migrations/migrationList.ts',
    ])
    const stacks = detectStacks(root)
    expect(stacks.kysely).toEqual({
      roots: ['src', 'server'],
      objectNames: ['db', 'trx'],
    })
    expect(kyselyMigrationsNote(stacks)).toMatch(/kysely.migrations left out/)
  })
  it('detects nothing without the dependency', () => {
    const root = project({ pg: '^8' }, ['src/migrations/index.ts'])
    expect(detectStacks(root).kysely).toBeUndefined()
    expect(kyselyMigrationsNote(detectStacks(root))).toBe('')
  })
  it('infers the dialects from the installed drivers', () => {
    expect(
      inferredKyselyDialects(
        project({ 'better-sqlite3': '1', pg: '8', mysql2: '3' }, []),
      ),
    ).toEqual(['postgres', 'mysql', 'sqlite'])
    expect(inferredKyselyDialects(mkdtempSync(join(tmpdir(), 'dbq-')))).toEqual(
      [],
    )
  })
  it('prefers the configured dialects and refuses when none is known', () => {
    const root = project({ pg: '8' }, [])
    const base = { module: 'm.ts', export: 'migrations', moneyColumns: false }
    expect(kyselyDialectsOf(root, base)).toEqual(['postgres'])
    expect(kyselyDialectsOf(root, { ...base, dialects: ['sqlite'] })).toEqual([
      'sqlite',
    ])
    expect(() => kyselyDialectsOf(project({}, []), base)).toThrow(
      /dialects is not set/,
    )
  })
})
