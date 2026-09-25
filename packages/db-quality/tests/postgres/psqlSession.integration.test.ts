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
  it('refuses more than one statement in the bench string, so nothing after the EXPLAIN runs', () => {
    for (const sql of [
      'select 1; commit; select 1',
      'select 1; set transaction read write; select 1',
      'select 1; create table dbq_probe (a int)',
    ])
      expect(() => session().explain(sql)).toThrow(
        /cannot open multi-query plan as cursor/,
      )
    expect(session().rows("select to_regclass('dbq_probe') as probe")).toEqual([
      { probe: null },
    ])
  })
  it('rolls back what EXPLAIN ANALYZE of a utility write did, which read-only does not stop', () => {
    for (const sql of [
      'create table dbq_probe as select 1 as a',
      'select 1 as a into dbq_probe',
      'create materialized view dbq_probe as select 1 as a',
    ])
      session().explain(sql)
    expect(session().rows("select to_regclass('dbq_probe') as probe")).toEqual([
      { probe: null },
    ])
  })
})
