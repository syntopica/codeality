import { describe, expect, it } from 'vitest'

import { psqlSession } from '@/postgres/psqlSession.js'
import type { PsqlSession } from '@/postgres/PsqlSessionType.js'
import { resolvePostgresTarget } from '@/postgres/resolvePostgresTarget.js'
import { spawnRunner } from '@/tools/spawnRunner.js'

const url = process.env['DB_QUALITY_TEST_DB_URL']

describe.skipIf(!url)('psqlSession against a real database', () => {
  const session = (): PsqlSession => {
    const target = resolvePostgresTarget('/', { 'db-url': url })
    if (!target) throw new Error('unreachable')
    return psqlSession(spawnRunner, '/', target, 10000)
  }
  it('answers a read and explains a statement with quotes in it', () => {
    expect(session().rows('select 1 as one')).toEqual([{ one: 1 }])
    const plan = session().explain("select 'it''s' as a, $$x;y$$ as b")
    expect(JSON.parse(plan)).toMatchObject([
      { Plan: { 'Node Type': 'Result' } },
    ])
  })
  it('keeps the bench statement inside the read-only transaction', () => {
    expect(() => session().explain('select 1; commit; select 1')).toThrow(
      /EXECUTE of transaction commands is not implemented/,
    )
    expect(() =>
      session().explain('select 1; set transaction read write; select 1'),
    ).toThrow(/read-write mode must be set before any query/)
    expect(() =>
      session().explain('select 1; create table dbq_probe (a int)'),
    ).toThrow(/cannot execute CREATE TABLE in a read-only transaction/)
    expect(session().rows("select to_regclass('dbq_probe') as probe")).toEqual([
      { probe: null },
    ])
  })
})
