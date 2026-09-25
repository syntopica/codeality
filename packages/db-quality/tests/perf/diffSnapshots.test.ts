import { describe, expect, it } from 'vitest'

import { PERF_DEFAULTS } from '@/config/PERF_DEFAULTS.js'
import { diffSnapshots } from '@/perf/diffSnapshots.js'
import type { PerfSnapshot } from '@/perf/PerfSnapshot.js'
import { windowTables } from '@/perf/windowTables.js'

const BIG_TABLE = 'public.big'
const SMALL_TABLE = 'public.small'
const stat = (
  queryId: string,
  calls: number,
  totalMs: number,
  tempBlksWritten = 0,
) => ({
  role: 'service_role',
  queryId,
  text: `q${queryId}`,
  calls,
  totalMs,
  rows: 0,
  sharedBlksRead: 0,
  tempBlksWritten,
})
const table = (
  name: string,
  liveRows: number,
  seqScan: number,
  idxScan: number,
) => ({ name, liveRows, seqScan, idxScan, bytes: 0 })
const snap = (
  statements: ReturnType<typeof stat>[],
  tables: ReturnType<typeof table>[] = [],
): PerfSnapshot => ({
  schemaVersion: 1,
  toolVersion: '0.2.0',
  takenAt: 't',
  host: 'h',
  statsReset: 'r',
  statements,
  tables,
})

describe('diffSnapshots', () => {
  it('reports a regression, a slow query, a spill, a seq-scan table and an improvement', () => {
    const previous = snap(
      [
        stat('reg', 100, 1000),
        stat('slow', 100, 30000),
        stat('spill', 100, 100),
        stat('better', 100, 10000),
        stat('few', 100, 100),
      ],
      [table(BIG_TABLE, 20000, 100, 100), table(SMALL_TABLE, 10, 1000, 0)],
    )
    const current = snap(
      [
        stat('reg', 200, 3000),
        stat('slow', 200, 60000),
        stat('spill', 200, 200, 48),
        stat('better', 200, 12000),
        stat('few', 105, 5000),
      ],
      [table(BIG_TABLE, 20000, 5100, 200), table(SMALL_TABLE, 10, 9000, 0)],
    )
    const diff = diffSnapshots(previous, current, PERF_DEFAULTS, [])
    expect(diff.findings.map((f) => [f.code, f.subject])).toEqual([
      ['BDB901', 'service_role: qreg'],
      ['BDB902', 'service_role: qslow'],
      ['BDB903', BIG_TABLE],
      ['BDB904', 'service_role: qspill'],
    ])
    expect(diff.findings[0]?.message).toBe(
      'mean 10.00 ms -> 20.00 ms (+100%) over 100 calls',
    )
    expect(diff.improvements).toEqual([
      {
        subject: 'service_role: qbetter',
        previousMs: 100,
        currentMs: 20,
        calls: 100,
        savedMs: 8000,
      },
    ])
    expect(diff.savedMs).toBe(8000)
    expect(diff.lostMs).toBe(1000)
    expect(diff.from).toBe('t')
  })
  it('honours disable and minCalls', () => {
    const previous = snap([stat('reg', 100, 1000)])
    const current = snap([stat('reg', 200, 3000)])
    expect(
      diffSnapshots(previous, current, PERF_DEFAULTS, [
        { code: 'BDB901', reason: 'r' },
      ]).findings,
    ).toEqual([])
    expect(
      diffSnapshots(previous, snap([stat('reg', 110, 3000)]), PERF_DEFAULTS, [])
        .findings,
    ).toEqual([])
  })
  it('does not flag a regression that clears the percent but not a 5 ms floor', () => {
    const previous = snap([stat('floor', 100, 500)])
    const current = snap([stat('floor', 200, 1253)])
    expect(
      diffSnapshots(previous, current, PERF_DEFAULTS, []).findings,
    ).toEqual([])
  })
  it('flags a regression that clears both the percent and the 5 ms floor', () => {
    const previous = snap([stat('floor', 100, 1000)])
    const current = snap([stat('floor', 200, 2550)])
    expect(
      diffSnapshots(previous, current, PERF_DEFAULTS, []).findings.map(
        (f) => f.code,
      ),
    ).toEqual(['BDB901'])
  })
})

describe('windowTables', () => {
  it('takes the delta of the scan counters but keeps liveRows absolute', () => {
    const window = windowTables(
      snap([], [table(BIG_TABLE, 20000, 100, 100)]),
      snap([], [table(BIG_TABLE, 20000, 5100, 200)]),
    )
    expect(window).toEqual([
      { name: BIG_TABLE, liveRows: 20000, seqScan: 5000, idxScan: 100 },
    ])
  })
  it('uses absolute values on a reset, for a new table, or when a counter fell', () => {
    const previous: PerfSnapshot = {
      ...snap([], [table(BIG_TABLE, 20000, 100, 100)]),
      statsReset: 'r1',
    }
    const reset: PerfSnapshot = {
      ...snap([], [table(BIG_TABLE, 20000, 40, 10)]),
      statsReset: 'r2',
    }
    expect(windowTables(previous, reset)).toEqual([
      { name: BIG_TABLE, liveRows: 20000, seqScan: 40, idxScan: 10 },
    ])
    const fresh = windowTables(
      snap([], []),
      snap([], [table(SMALL_TABLE, 10, 5, 1)]),
    )
    expect(fresh).toEqual([
      { name: SMALL_TABLE, liveRows: 10, seqScan: 5, idxScan: 1 },
    ])
    const fell = windowTables(
      snap([], [table(BIG_TABLE, 20000, 100, 100)]),
      snap([], [table(BIG_TABLE, 20000, 90, 90)]),
    )
    expect(fell).toEqual([
      { name: BIG_TABLE, liveRows: 20000, seqScan: 90, idxScan: 90 },
    ])
  })
  it('a table gone from the current reading is not a window', () => {
    expect(
      windowTables(snap([], [table(BIG_TABLE, 20000, 100, 100)]), snap([], [])),
    ).toEqual([])
  })
})
