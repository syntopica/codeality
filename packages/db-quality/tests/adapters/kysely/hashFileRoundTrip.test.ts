import { copyFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { compileKyselyMigrations } from '@/adapters/kysely/compileKyselyMigrations.js'
import { baselineCommand } from '@/commands/baselineCommand.js'
import { checkCommand } from '@/commands/checkCommand.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { kyselyTempProject } from '@tests/adapters/kysely/kyselyTempProject.js'
import { commandIoFor } from '@tests/commands/commandIoFor.js'

const NAME = '2026_01_01_account'
const CONFIG = JSON.stringify({
  schemaVersion: 2,
  kysely: {
    roots: ['src'],
    migrations: { module: 'src/migrations.ts', dialects: ['mysql'] },
  },
})
const migrationsWith = (body: string): string =>
  `import type { Kysely } from 'kysely'\n\nexport const migrations = {\n  '${NAME}': {\n${body}\n    down: async (db: Kysely<unknown>) => { await db.schema.dropTable('account').execute() },\n  },\n}\n`
const V1 = migrationsWith(
  "    up: async (db: Kysely<unknown>) => { await db.schema.createTable('account').addColumn('id', 'bigint', (c) => c.primaryKey()).execute() },",
)
const REFORMATTED = migrationsWith(
  "    up: async (db: Kysely<unknown>) => {\n      await db.schema\n        .createTable('account')\n        .addColumn('id', 'bigint', (c) => c.primaryKey())\n        .execute()\n    },",
)
const RETYPED = migrationsWith(
  "    up: async (db: Kysely<unknown>) => { await db.schema.createTable('account').addColumn('id', 'text', (c) => c.primaryKey()).execute() },",
)

// Each version lives in its own directory (jiti caches a module by path) and
// inherits the previous one's recorded files, as a commit would.
const version = async (
  source: string,
  previous?: string,
): Promise<ReturnType<typeof commandIoFor>> => {
  const root = kyselyTempProject({
    'codeality-db.json': CONFIG,
    'src/migrations.ts': source,
  })
  if (previous)
    for (const file of [
      '.codeality-db-kysely.json',
      '.codeality-db-baseline.json',
    ])
      copyFileSync(join(previous, file), join(root, file))
  const compiled = JSON.stringify(
    await compileKyselyMigrations({
      root,
      module: 'src/migrations.ts',
      export: 'migrations',
      dialects: ['mysql'],
    }),
  )
  const runner: CommandRunner = (command) => ({
    status: 0,
    stdout: command === process.execPath ? compiled : '[]',
    stderr: '',
    missing: false,
  })
  return commandIoFor(root, runner)
}

describe('the Kysely hash file round trip', () => {
  it('ignores a reformat, catches a type change, and clears on --accept-edit', async () => {
    const created = await version(V1)
    expect(baselineCommand(['create'], created)).toBe(0)
    expect(created.out.join('')).toMatch(
      /recorded 1 Kysely migrations in \.codeality-db-kysely\.json/,
    )
    const reformatted = await version(REFORMATTED, created.root)
    expect(checkCommand([], reformatted)).toBe(0)
    const retyped = await version(RETYPED, reformatted.root)
    expect(checkCommand([], retyped)).toBe(1)
    expect(retyped.out.join('')).toMatch(
      /BDB320\/migration-edited released migration was edited: what it runs on mysql/,
    )
    expect(baselineCommand(['update'], retyped)).toBe(2)
    expect(retyped.err.join('')).toMatch(`pass --accept-edit ${NAME}`)
    expect(baselineCommand(['check', '--accept-edit', NAME], retyped)).toBe(2)
    expect(baselineCommand(['update', '--accept-edit', NAME], retyped)).toBe(0)
    retyped.out.length = 0
    expect(checkCommand([], retyped)).toBe(0)
    expect(baselineCommand(['check'], retyped)).toBe(0)
  }, 30_000)
  it('refuses --accept-edit on a project without kysely.migrations', () => {
    const root = kyselyTempProject({
      'codeality-db.json': JSON.stringify({
        schemaVersion: 2,
        kysely: { roots: ['src'] },
      }),
    })
    const io = commandIoFor(root, () => ({
      status: 0,
      stdout: '[]',
      stderr: '',
      missing: false,
    }))
    expect(baselineCommand(['update', '--accept-edit', NAME], io)).toBe(2)
    expect(io.err.join('')).toMatch(
      /--accept-edit needs a kysely.migrations section/,
    )
    expect(baselineCommand(['update'], io)).toBe(0)
    expect(io.out.join('')).not.toMatch(/Kysely/)
  })
})
