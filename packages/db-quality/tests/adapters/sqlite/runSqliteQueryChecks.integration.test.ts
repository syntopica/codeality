import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { beforeAll, describe, expect, it } from 'vitest'

import { runSqliteQueryChecks } from '@/adapters/sqlite/runSqliteQueryChecks.js'
import { sqliteQueriesNotice } from '@/check/sqliteQueriesNotice.js'
import { configFromDocument } from '@/config/configFromDocument.js'
import { spawnRunner } from '@/tools/spawnRunner.js'

const installed = !spawnRunner('sqlite3', ['--version'], { cwd: process.cwd() })
  .missing

const JOBS_LIST = 'sql/jobs_list.sql'
const queries = {
  [JOBS_LIST]: [
    '-- the shape Vexa shipped',
    'SELECT id, state FROM jobs j',
    "WHERE (?1 IS NULL OR instr(',' || ?1 || ',', ',' || j.state || ',') > 0)",
    'ORDER BY created DESC',
    'LIMIT ?2;',
  ].join('\n'),
  'sql/jobs_fixed.sql':
    'SELECT id FROM jobs WHERE state IN (SELECT value FROM json_each(?1)) ORDER BY state, created;',
  'sql/nested/cte.sql': [
    "WITH recent AS (SELECT id, created FROM jobs WHERE state = 'a')",
    'SELECT * FROM recent, (SELECT 1 AS k) s WHERE recent.id = ?1;',
  ].join('\n'),
  'sql/nested/by_state.sql': 'SELECT created FROM jobs ORDER BY state;',
  'sql/small.sql': 'SELECT * FROM tiny;',
  'sql/unplannable.sql': [
    'SELECT * FROM table_only_the_app_creates WHERE id = ?1;',
    'SELECT FROM WHERE;',
    'SELECT id FROM jobs WHERE vexa_strip_digits(state) = ?1 AND state = ?2;',
    'PRAGMA foreign_keys = ON;',
  ].join('\n'),
  'sql/notes.txt': 'SELECT * FROM jobs;',
}

const projectWith = (database: string): string => {
  const root = mkdtempSync(join(tmpdir(), 'dbq-'))
  for (const [path, sql] of Object.entries(queries)) {
    mkdirSync(join(root, path, '..'), { recursive: true })
    writeFileSync(join(root, path), sql)
  }
  writeFileSync(join(root, 'bad.db'), 'not a database')
  if (database === 'dev.db')
    execFileSync('sqlite3', [
      join(root, 'dev.db'),
      [
        'create table jobs (id integer primary key, state text not null, created integer not null);',
        'create index idx_jobs on jobs (state, created);',
        'create table tiny (id integer primary key, name text);',
        "with recursive n(i) as (select 1 union all select i + 1 from n where i < 2000) insert into jobs (state, created) select case i % 3 when 0 then 'a' when 1 then 'b' else 'c' end, i from n;",
        "insert into tiny (name) values ('x');",
      ].join(' '),
    ])
  return root
}

describe.skipIf(!installed)(
  'runSqliteQueryChecks with the real sqlite3',
  () => {
    let root = ''
    beforeAll(() => {
      root = projectWith('dev.db')
    })
    const run = (database?: string): string[][] =>
      runSqliteQueryChecks(
        spawnRunner,
        root,
        {
          paths: ['sql'],
          minRows: 1000,
          ...(database === undefined ? {} : { database }),
        },
        [],
      ).map((f) => [f.path, String(f.line), f.code, f.subject])

    it('reports the guard, the comma list and the scans they cause', () => {
      expect(run('dev.db')).toEqual([
        [JOBS_LIST, '3', 'BDB404', '?1'],
        [JOBS_LIST, '3', 'BDB405', '?1'],
        [JOBS_LIST, '2', 'BDB406', 'jobs'],
        ['sql/nested/by_state.sql', '1', 'BDB406', 'jobs'],
      ])
    })
    it('names the table, its rows, the plan and the sort', () => {
      const findings = runSqliteQueryChecks(
        spawnRunner,
        root,
        { paths: ['sql'], database: join(root, 'dev.db'), minRows: 1000 },
        [],
      ).filter((f) => f.code === 'BDB406')
      expect(findings[0]?.message).toMatch(
        /^full table scan of jobs \(2000 rows\) .*: SCAN j, then USE TEMP B-TREE FOR ORDER BY; /,
      )
      expect(findings[1]?.message).toMatch(
        /^full index scan of jobs \(2000 rows\) .*: SCAN jobs USING COVERING INDEX idx_jobs; /,
      )
    })
    it('stays quiet under the row threshold and when BDB406 is disabled', () => {
      expect(
        runSqliteQueryChecks(
          spawnRunner,
          root,
          { paths: ['sql'], database: 'dev.db', minRows: 5000 },
          [],
        ).map((f) => f.code),
      ).toEqual(['BDB404', 'BDB405'])
      expect(
        runSqliteQueryChecks(
          spawnRunner,
          root,
          { paths: ['sql'], database: 'dev.db', minRows: 1 },
          [{ code: 'BDB406', reason: 'test' }],
        ).map((f) => f.code),
      ).toEqual(['BDB404', 'BDB405'])
    })
    it('runs the static rules alone without a readable database', () => {
      const statics = [
        [JOBS_LIST, '3', 'BDB404', '?1'],
        [JOBS_LIST, '3', 'BDB405', '?1'],
      ]
      expect(run()).toEqual(statics)
      expect(run('missing.db')).toEqual(statics)
      expect(run('bad.db')).toEqual(statics)
    })
    it('says on stderr why the plan check was skipped', () => {
      const notice = (database: string): string | undefined =>
        sqliteQueriesNotice(
          spawnRunner,
          root,
          configFromDocument({
            schemaVersion: 2,
            sqlite: { files: [], queries: { paths: ['sql'], database } },
          }),
        )
      expect(notice('dev.db')).toBeUndefined()
      expect(notice('missing.db')).toBe(
        `sqlite.queries.database ${join(root, 'missing.db')} does not exist; the query-plan check BDB406 was skipped`,
      )
      expect(notice('bad.db')).toMatch(/is not a readable SQLite database/)
    })
  },
)
