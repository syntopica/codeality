import { describe, expect, it } from 'vitest'

import { inlinedSqliteStatement } from '@/adapters/kysely/inlinedSqliteStatement.js'
import { kyselySqliteFindings } from '@/adapters/kysely/kyselySqliteFindings.js'
import { sqliteFailureReason } from '@/adapters/kysely/sqliteFailureReason.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'
import { locatedFixture } from '@tests/adapters/kysely/locatedFixture.js'

describe('SQLite application helpers', () => {
  it('inlines each ? as a literal, leaving quoted ones alone', () => {
    expect(
      inlinedSqliteStatement({
        sql: 'insert into "t?" ("a", "b", "c", "d", "e") values (?, ?, ?, ?, ?) -- \'?\'',
        parameters: ["it's", 3, true, null, { k: 1 }],
      }),
    ).toBe(
      'insert into "t?" ("a", "b", "c", "d", "e") values (\'it\'\'s\', 3, 1, NULL, \'{"k":1}\') -- \'?\'',
    )
  })
  it('names the refused statement when the shell says which argument failed', () => {
    const args = ['-bail', 'db', 'begin;', 'create type x;', 'commit;']
    expect(
      sqliteFailureReason(
        'Parse error in 4th command line argument: near "type": syntax error\n  create type x;\n         ^--- error here\n',
        args,
      ),
    ).toBe('near "type": syntax error in: create type x;')
    expect(
      sqliteFailureReason(
        'Parse error in 9th command line argument: no such table: b\n',
        args,
      ),
    ).toBe('no such table: b')
    expect(sqliteFailureReason('Error: disk I/O error\n', args)).toBe(
      'disk I/O error',
    )
  })
})

describe('kyselySqliteFindings', () => {
  it('needs sqlite3, and skips the table checks when nothing was applied', () => {
    const migration = locatedFixture('a', {
      sqlite: ['create table "t" ("id" integer)'],
    })
    const missing: CommandRunner = () => ({
      status: -1,
      stdout: '',
      stderr: '',
      missing: true,
    })
    expect(() =>
      kyselySqliteFindings(missing, [migration], 'm.ts', []),
    ).toThrow(ToolMissingError)
    const commands: string[] = []
    const refusing: CommandRunner = (command) => {
      commands.push(command)
      return { status: 1, stdout: '', stderr: 'Error: nope\n', missing: false }
    }
    expect(
      kyselySqliteFindings(refusing, [migration], 'm.ts', []).map((f) => [
        f.code,
        f.message,
      ]),
    ).toEqual([
      ['BDB320/migration-fails-on-sqlite', 'migration fails on SQLite: nope'],
    ])
    expect(commands).toEqual(['sqlite3'])
  })
})
