import { beforeAll, describe, expect, it } from 'vitest'

import type { CompiledMigration } from '@/adapters/kysely/CompiledMigration.js'
import { compileKyselyMigrations } from '@/adapters/kysely/compileKyselyMigrations.js'
import { runKyselyMigrationChecks } from '@/adapters/kysely/runKyselyMigrationChecks.js'
import type { KyselyDialect } from '@/config/KyselyDialect.js'
import { compareFindings } from '@/model/compareFindings.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { spawnRunner } from '@/tools/spawnRunner.js'

const FIXTURE = new URL('../../fixtures/kysely', import.meta.url).pathname
const MODULE = 'db/migrations/migrationList.ts'
const available = (tool: string): boolean =>
  !spawnRunner(tool, ['--version'], { cwd: process.cwd() }).missing

// The compiler process needs the built bundle; its in-process twin produces
// the same JSON, so the runner hands that back and lets squawk and sqlite3 run
// for real.
let compiled: CompiledMigration[] = []
const WITHOUT_DOWN = [
  '11',
  'BDB320/migration-without-down',
  '2026_01_02_note_without_down',
]
const FLOAT_MONEY = [
  '14',
  'BDB320/float-money',
  '2026_01_05_pet_inline_references',
]
const INLINE_REFERENCES = [
  '14',
  'BDB320/inline-references',
  '2026_01_05_pet_inline_references',
]
const SQUAWK = [
  'constraint-missing-not-valid',
  'disallowed-unique-constraint',
  'prefer-robust-stmts',
].map((rule) => ['13', `BDB100/${rule}`, '2026_01_04_unique_email'])
const SQLITE = [
  ['0', 'BDB403', 'tag'],
  ['12', 'BDB320/migration-fails-on-sqlite', '2026_01_03_mood_enum'],
  ['13', 'BDB320/migration-fails-on-sqlite', '2026_01_04_unique_email'],
]
const goldenFor = (dialects: KyselyDialect[]): string[][] => {
  const runner: CommandRunner = (command, args, options) =>
    command === process.execPath
      ? {
          status: 0,
          stdout: JSON.stringify(
            compiled.map((migration) => ({
              ...migration,
              dialects: Object.fromEntries(
                dialects.map((dialect) => [
                  dialect,
                  migration.dialects[dialect],
                ]),
              ),
            })),
          ),
          stderr: '',
          missing: false,
        }
      : spawnRunner(command, args, options)
  return runKyselyMigrationChecks(
    runner,
    FIXTURE,
    {
      roots: ['db'],
      objectNames: ['db', 'trx'],
      migrations: {
        module: MODULE,
        export: 'migrationList',
        dialects,
        moneyColumns: true,
      },
    },
    [],
  )
    .sort(compareFindings)
    .map((f) => [String(f.line), f.code, f.subject])
}

describe.skipIf(!available('squawk') || !available('sqlite3'))(
  'Kysely migration checks on the fixture project',
  () => {
    beforeAll(async () => {
      compiled = await compileKyselyMigrations({
        root: FIXTURE,
        module: MODULE,
        export: 'migrationList',
        dialects: ['postgres', 'mysql', 'sqlite'],
      })
    })
    it('postgres: squawk on the compiled SQL', () => {
      expect(goldenFor(['postgres'])).toEqual([
        WITHOUT_DOWN,
        ...SQUAWK,
        FLOAT_MONEY,
      ])
    })
    it('mysql: the cross-dialect rules alone', () => {
      expect(goldenFor(['mysql'])).toEqual([
        WITHOUT_DOWN,
        FLOAT_MONEY,
        INLINE_REFERENCES,
      ])
    })
    it('sqlite: applied in order, then the table checks', () => {
      const [table, mood, unique] = SQLITE
      expect(goldenFor(['sqlite'])).toEqual([
        table,
        WITHOUT_DOWN,
        mood,
        unique,
        FLOAT_MONEY,
      ])
    })
    it('all three: native enums become a portability finding', () => {
      const [table, mood, unique] = SQLITE
      expect(goldenFor(['postgres', 'mysql', 'sqlite'])).toEqual([
        table,
        WITHOUT_DOWN,
        mood,
        ['12', 'BDB320/native-enum', '2026_01_03_mood_enum'],
        ...SQUAWK,
        unique,
        FLOAT_MONEY,
        INLINE_REFERENCES,
      ])
    })
  },
)
