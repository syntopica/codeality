import { describe, expect, it } from 'vitest'

import { psqlSession } from '@/postgres/psqlSession.js'
import { resolvePostgresTarget } from '@/postgres/resolvePostgresTarget.js'
import { spawnRunner } from '@/tools/spawnRunner.js'

const url = process.env['DB_QUALITY_TEST_DB_URL']

describe.skipIf(!url)('psqlSession against a real database', () => {
  it('refuses a write and answers a read', () => {
    const target = resolvePostgresTarget('/', { 'db-url': url })
    if (!target) throw new Error('unreachable')
    const session = psqlSession(spawnRunner, '/', target, 10000)
    expect(session.rows('select 1 as one')).toEqual([{ one: 1 }])
    // create is not select-shaped, so it goes through text() (unwrapped) rather
    // than rows() (which wraps every statement in a json_agg subquery and would
    // hit Postgres's parser before its read-only check).
    expect(() => session.text('create temp table dbq_probe (a int)')).toThrow(
      /read-only transaction/,
    )
  })
})
