import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runSqliteChecks } from '@/adapters/sqlite/runSqliteChecks.js'
import { spawnRunner } from '@/tools/spawnRunner.js'

const installed = !spawnRunner('sqlite3', ['--version'], { cwd: process.cwd() })
  .missing

describe.skipIf(!installed)('runSqliteChecks with the real sqlite3', () => {
  it('finds the table without a primary key in a fresh database', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    execFileSync('sqlite3', [
      join(root, 'a.db'),
      'create table ok (id integer primary key); create table bare (x text);',
    ])
    expect(
      runSqliteChecks(spawnRunner, root, ['a.db'], []).map((f) => [
        f.code,
        f.subject,
      ]),
    ).toEqual([['BDB403', 'bare']])
  })
})
