import { describe, expect, it } from 'vitest'

import { runSqliteChecks } from '@/adapters/sqlite/runSqliteChecks.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

const answers: Record<string, string> = {
  'PRAGMA integrity_check': '[{"integrity_check":"ok"}]',
  'PRAGMA foreign_key_check':
    '[{"table":"posts","rowid":3,"parent":"users","fkid":0}]',
  "select name, sql from sqlite_master where type = 'table' and name not like 'sqlite_%'":
    '[{"name":"users","sql":"CREATE TABLE users (id INTEGER PRIMARY KEY)"},{"name":"log","sql":"CREATE TABLE log (line TEXT)"}]',
}
const runner: CommandRunner = (_command, args) => ({
  status: 0,
  stdout: answers[args[args.length - 1] ?? ''] ?? '',
  stderr: '',
  missing: false,
})

describe('runSqliteChecks', () => {
  it('reports the dangling foreign key and the table without a primary key', () => {
    expect(
      runSqliteChecks(runner, '/p', ['data/app.db'], []).map((f) => [
        f.code,
        f.subject,
      ]),
    ).toEqual([
      ['BDB402', 'posts'],
      ['BDB403', 'log'],
    ])
  })
  it('honours the disable list', () => {
    expect(
      runSqliteChecks(runner, '/p', ['data/app.db'], ['BDB402', 'BDB403']),
    ).toEqual([])
  })
  it('reports a failed integrity check as an error', () => {
    const broken: CommandRunner = (_c, args) => ({
      status: 0,
      stdout:
        args.at(-1) === 'PRAGMA integrity_check'
          ? '[{"integrity_check":"*** in database main *** Page 3: btreeInitPage() returns error code 11"}]'
          : '[]',
      stderr: '',
      missing: false,
    })
    expect(runSqliteChecks(broken, '/p', ['a.db'], [])[0]).toMatchObject({
      code: 'BDB401',
      severity: 'error',
      path: 'a.db',
    })
  })
  it('raises ToolMissingError without sqlite3 and reports a failed query', () => {
    const absent: CommandRunner = () => ({
      status: -1,
      stdout: '',
      stderr: '',
      missing: true,
    })
    expect(() => runSqliteChecks(absent, '/p', ['a.db'], [])).toThrow(
      ToolMissingError,
    )
    const failing: CommandRunner = () => ({
      status: 1,
      stdout: '',
      stderr: 'unable to open',
      missing: false,
    })
    expect(() => runSqliteChecks(failing, '/p', ['a.db'], [])).toThrow(
      /sqlite3 failed on a.db: unable to open/,
    )
  })
})
