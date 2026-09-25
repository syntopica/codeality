import { describe, expect, it } from 'vitest'

import { PERF_DEFAULTS } from '@/config/PERF_DEFAULTS.js'
import { diffSnapshots } from '@/perf/diffSnapshots.js'
import type { PerfSnapshot } from '@/perf/PerfSnapshot.js'
import { renderPerfDiff } from '@/perf/renderPerfDiff.js'
import { renderPerfDiffJson } from '@/perf/renderPerfDiffJson.js'

const PREVIOUS_AT = '2026-09-25T16:00:00.000Z'
const CURRENT_AT = '2026-09-26T09:12:00.000Z'
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
  takenAt: string,
  statements: ReturnType<typeof stat>[],
  tables: ReturnType<typeof table>[] = [],
): PerfSnapshot => ({
  schemaVersion: 1,
  toolVersion: '0.2.0',
  takenAt,
  host: 'h',
  statsReset: 'r',
  statements,
  tables,
})

describe('renderPerfDiff', () => {
  it('renders the header, the improvements block, the summary line and every finding', () => {
    const previous = snap(
      PREVIOUS_AT,
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
      CURRENT_AT,
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
    expect(renderPerfDiff(diff)).toBe(
      [
        'perf diff: 2026-09-25T16:00:00.000Z -> 2026-09-26T09:12:00.000Z',
        'improvements',
        '  -80%   100.00 ms -> 20.00 ms  x100  service_role: qbetter',
        'saved 8,000 ms against the previous means; regressions cost 1,000 ms',
        'postgres:0: BDB901 mean 10.00 ms -> 20.00 ms (+100%) over 100 calls (service_role: qreg)',
        'postgres:0: BDB902 mean 300.00 ms over 100 calls, threshold 100 ms (service_role: qslow)',
        'postgres:0: BDB903 5,000 sequential scans against 100 index scans on 20,000 live rows (public.big)',
        'postgres:0: BDB904 wrote 48 temp blocks over 100 calls: a sort or hash spilled to disk (service_role: qspill)',
        '4 findings',
      ].join('\n'),
    )
  })
  it('omits the improvements block and the summary line when nothing moved', () => {
    const previous = snap(PREVIOUS_AT, [stat('few', 1, 10)])
    const current = snap(CURRENT_AT, [stat('few', 2, 20)])
    const diff = diffSnapshots(previous, current, PERF_DEFAULTS, [])
    expect(renderPerfDiff(diff)).toBe(
      [
        'perf diff: 2026-09-25T16:00:00.000Z -> 2026-09-26T09:12:00.000Z',
        '0 findings',
      ].join('\n'),
    )
  })
})

describe('renderPerfDiffJson', () => {
  it('renders schemaVersion 1 with the diff fields, pretty-printed', () => {
    const diff = diffSnapshots(
      snap(PREVIOUS_AT, [stat('reg', 100, 1000)]),
      snap(CURRENT_AT, [stat('reg', 200, 3000)]),
      PERF_DEFAULTS,
      [],
    )
    expect(JSON.parse(renderPerfDiffJson(diff))).toEqual({
      schemaVersion: 1,
      from: PREVIOUS_AT,
      to: CURRENT_AT,
      savedMs: diff.savedMs,
      lostMs: diff.lostMs,
      improvements: diff.improvements,
      findings: diff.findings,
    })
  })
})
