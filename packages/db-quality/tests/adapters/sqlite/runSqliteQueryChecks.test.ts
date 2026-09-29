import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { resolveQueryDatabase } from '@/adapters/sqlite/resolveQueryDatabase.js'
import { runSqliteQueryChecks } from '@/adapters/sqlite/runSqliteQueryChecks.js'
import { sqliteQueriesNotice } from '@/check/sqliteQueriesNotice.js'
import { ConfigError } from '@/config/ConfigError.js'
import { configFromDocument } from '@/config/configFromDocument.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

const absent: CommandRunner = () => ({
  status: -1,
  stdout: '',
  stderr: '',
  missing: true,
})
const project = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'dbq-'))
  mkdirSync(join(root, 'sql'))
  writeFileSync(
    join(root, 'sql/q.sql'),
    'SELECT * FROM t WHERE ?1 IS NULL OR a = ?1;',
  )
  writeFileSync(join(root, 'app.db'), '')
  return root
}

describe('runSqliteQueryChecks', () => {
  it('refuses a path that is not a directory', () => {
    expect(() =>
      runSqliteQueryChecks(
        absent,
        project(),
        { paths: ['nope'], minRows: 1 },
        [],
      ),
    ).toThrow(ConfigError)
  })
  it('honours the disable list for the static rules', () => {
    expect(
      runSqliteQueryChecks(absent, project(), { paths: ['sql'], minRows: 1 }, [
        { code: 'BDB404', reason: 'test' },
      ]),
    ).toEqual([])
  })
  it('raises ToolMissingError when a database is configured and sqlite3 is absent', () => {
    expect(() =>
      runSqliteQueryChecks(
        absent,
        project(),
        { paths: ['sql'], database: 'app.db', minRows: 1 },
        [],
      ),
    ).toThrow(ToolMissingError)
  })
  it('leaves a missing sqlite3 for the check to report rather than the notice', () => {
    const config = configFromDocument({
      schemaVersion: 2,
      sqlite: { files: [], queries: { paths: ['sql'], database: 'app.db' } },
    })
    expect(sqliteQueriesNotice(absent, project(), config)).toBeUndefined()
    expect(
      sqliteQueriesNotice(absent, project(), {
        ...config,
        disable: [{ code: 'BDB406', reason: 'test' }],
      }),
    ).toBeUndefined()
  })
  it('expands a leading ~/ and resolves anything else against the root', () => {
    expect(resolveQueryDatabase('/p', '~/dev/app.db')).toBe(
      join(homedir(), 'dev/app.db'),
    )
    expect(resolveQueryDatabase('/p', 'data/app.db')).toBe('/p/data/app.db')
    expect(resolveQueryDatabase('/p', '/abs/app.db')).toBe('/abs/app.db')
  })
})
