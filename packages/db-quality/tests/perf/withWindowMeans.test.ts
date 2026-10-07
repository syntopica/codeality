import { describe, expect, it } from 'vitest'

import type { PerfSnapshot } from '@/perf/PerfSnapshot.js'
import type { StatementStat } from '@/perf/StatementStat.js'
import { windowStatements } from '@/perf/windowStatements.js'
import { withWindowMeans } from '@/perf/withWindowMeans.js'

const stat = (queryId: string, calls: number, totalMs: number) => ({
  role: 'service_role',
  queryId,
  text: `q${queryId}`,
  calls,
  totalMs,
  rows: 0,
  sharedBlksRead: 0,
  tempBlksWritten: 0,
})
const snap = (
  statsReset: string,
  statements: StatementStat[],
): PerfSnapshot => ({
  schemaVersion: 1,
  toolVersion: '0.4.0',
  takenAt: 't',
  host: 'h',
  statsReset,
  statements,
  tables: [],
})

describe('withWindowMeans', () => {
  it('records the mean of the window since the previous snapshot', () => {
    const recorded = withWindowMeans(
      snap('r1', [stat('1', 100, 1000), stat('2', 10, 10)]),
      snap('r1', [stat('1', 150, 1750), stat('2', 10, 10), stat('3', 5, 50)]),
    )
    expect(recorded.statements.map((s) => s.windowMeanMs)).toEqual([
      15,
      undefined,
      undefined,
    ])
  })
  it('records nothing across a stats reset', () => {
    const recorded = withWindowMeans(
      snap('r1', [stat('1', 100, 1000)]),
      snap('r2', [stat('1', 20, 400)]),
    )
    expect(recorded.statements[0]?.windowMeanMs).toBeUndefined()
  })
  it('lets a later diff ignore drift older than the last snapshot', () => {
    // 100 calls at 10 ms long ago, then 50 at 30 ms before the snapshot was
    // refreshed; a reading at 31 ms is no regression against the recent 30,
    // where the cumulative mean (16.7 ms) would call it +86%.
    const first = snap('r1', [stat('1', 100, 1000)])
    const second = withWindowMeans(first, snap('r1', [stat('1', 150, 2500)]))
    const [window] = windowStatements(
      second,
      snap('r1', [stat('1', 200, 4050)]),
    )
    expect(window).toMatchObject({ meanMs: 31, previousMeanMs: 30 })
  })
})
