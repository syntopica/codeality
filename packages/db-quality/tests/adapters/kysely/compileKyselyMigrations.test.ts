import { describe, expect, it } from 'vitest'

import { compileKyselyMigrations } from '@/adapters/kysely/compileKyselyMigrations.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'
import { kyselyTempProject } from '@tests/adapters/kysely/kyselyTempProject.js'
import { migrationList } from '@tests/fixtures/kysely/db/migrations/migrationList.js'
import first from '@tests/fixtures/kysely/folder/2026_01_01_first.js'
import * as second from '@tests/fixtures/kysely/folder/2026_01_02_second.js'

const FIXTURE = new URL('../../fixtures/kysely', import.meta.url).pathname
const MODULE = 'db/migrations/migrationList.ts'
const STEP = "import type { Kysely } from 'kysely'\n"

describe('compileKyselyMigrations', () => {
  it('compiles a module of migrations on every dialect, in declaration order', async () => {
    const compiled = await compileKyselyMigrations({
      root: FIXTURE,
      module: MODULE,
      export: 'migrationList',
      dialects: ['postgres', 'mysql', 'sqlite'],
    })
    expect(compiled.map((m) => m.name)).toEqual(Object.keys(migrationList))
    expect(compiled.map((m) => [m.name, m.hasDown])).toEqual([
      ['2026_01_01_account', true],
      ['2026_01_02_note_without_down', false],
      ['2026_01_03_mood_enum', true],
      ['2026_01_04_unique_email', true],
      ['2026_01_05_pet_inline_references', true],
    ])
    const account = compiled[0]
    expect(account?.path).toBe(MODULE)
    expect(account?.dialects.postgres?.up[0]?.sql).toBe(
      'create table if not exists "account" ("id" bigint primary key, "email" text not null)',
    )
    expect(account?.dialects.mysql?.up[0]?.sql).toMatch(
      /^create table if not exists `account`/,
    )
    expect(account?.dialects.sqlite?.down).toEqual([
      { sql: 'drop table if exists "account"', parameters: [] },
    ])
  })
  it('loads a folder in name order, from a default export or the module', async () => {
    const compiled = await compileKyselyMigrations({
      root: FIXTURE,
      folder: 'folder',
      export: 'migrations',
      dialects: ['sqlite'],
    })
    expect(compiled.map((m) => [m.name, m.path, m.hasDown])).toEqual([
      ['2026_01_01_first', 'folder/2026_01_01_first.ts', 'down' in first],
      ['2026_01_02_second', 'folder/2026_01_02_second.ts', true],
    ])
    expect(typeof second.up).toBe('function')
    expect(typeof second.down).toBe('function')
  })
  it('records parameters JSON-safe and a throwing step as an error', async () => {
    const root = kyselyTempProject({
      'm.ts': `${STEP}export const migrations = {
  a: { up: async (db: Kysely<any>) => { await db.insertInto('t').values({ n: 10n, at: new Date(0), b: new Uint8Array([1]) }).execute() } },
  b: { up: async () => { throw new Error('boom') }, down: async () => {} },
}`,
    })
    const [a, b] = await compileKyselyMigrations({
      root,
      module: 'm.ts',
      export: 'migrations',
      dialects: ['postgres'],
    })
    expect(a?.dialects.postgres?.up).toEqual([
      {
        sql: 'insert into "t" ("n", "at", "b") values ($1, $2, $3)',
        parameters: ['10', '1970-01-01T00:00:00.000Z', "x'01'"],
      },
    ])
    expect(b?.dialects.postgres?.error).toBe('up: boom')
  })
  it('refuses a missing module, a missing export and a value with no up()', async () => {
    const root = kyselyTempProject({
      'm.ts':
        'export const other = {}\nexport const migrations = { a: { down: async () => {} } }\n',
    })
    const request = {
      root,
      export: 'migrations',
      dialects: ['sqlite' as const],
    }
    await expect(
      compileKyselyMigrations({ ...request, module: 'nope.ts' }),
    ).rejects.toThrow(ConfigError)
    await expect(
      compileKyselyMigrations({ ...request, module: 'm.ts', export: 'list' }),
    ).rejects.toThrow(
      /exports no object named "list" \(it exports: migrations, other\)/,
    )
    await expect(
      compileKyselyMigrations({ ...request, module: 'm.ts' }),
    ).rejects.toThrow(/"a" in m.ts has no up\(\)/)
  })
})
