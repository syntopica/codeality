import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { PERF_DEFAULTS } from '@/config/PERF_DEFAULTS.js'
import { takePerfSnapshot } from '@/perf/takePerfSnapshot.js'
import type { PsqlSession } from '@/postgres/PsqlSessionType.js'

const statements = JSON.parse(
  readFileSync(
    new URL('../fixtures/perf/statements.json', import.meta.url),
    'utf8',
  ),
) as unknown[]

describe('takePerfSnapshot', () => {
  it('reads statements, tables and the reset marker, dropping the noise', () => {
    const sqls: string[] = []
    const session: PsqlSession = {
      rows: (sql) => {
        sqls.push(sql)
        if (sql.includes('pg_stat_statements_info'))
          return [{ stats_reset: '2026-05-07 22:41:57+00' }]
        if (sql.includes('pg_stat_user_tables'))
          return [
            {
              name: 'public.jobs',
              live_rows: 389,
              seq_scan: 30831,
              idx_scan: 321779,
              bytes: 3006464,
            },
          ]
        return statements
      },
      explain: () => '',
    }
    const snapshot = takePerfSnapshot(
      session,
      PERF_DEFAULTS,
      'h',
      '2026-09-25T16:00:00.000Z',
    )
    expect(snapshot.statements.map((s) => s.queryId)).toEqual(['-11', '22'])
    expect(snapshot.statements[0]).toEqual({
      role: 'service_role',
      queryId: '-11',
      text: 'WITH pgrst_source AS (SELECT 1)',
      calls: 100,
      totalMs: 2500.5,
      rows: 100,
      sharedBlksRead: 3,
      tempBlksWritten: 0,
    })
    expect(snapshot.tables).toEqual([
      {
        name: 'public.jobs',
        liveRows: 389,
        seqScan: 30831,
        idxScan: 321779,
        bytes: 3006464,
      },
    ])
    expect(snapshot.statsReset).toBe('2026-05-07 22:41:57+00')
    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      host: 'h',
      takenAt: '2026-09-25T16:00:00.000Z',
    })
    expect(sqls[0]).toContain(
      "r.rolname in ('authenticator', 'service_role', 'postgres')",
    )
  })
  it('tolerates a null reset marker', () => {
    const session: PsqlSession = {
      rows: (sql) => (sql.includes('_info') ? [{ stats_reset: null }] : []),
      explain: () => '',
    }
    expect(
      takePerfSnapshot(session, PERF_DEFAULTS, 'h', 't').statsReset,
    ).toBeNull()
  })
})
