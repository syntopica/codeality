import { describe, expect, it } from 'vitest'

import type { PerfSnapshot } from '@/perf/PerfSnapshot.js'
import { windowStatements } from '@/perf/windowStatements.js'

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
const snap = (
  statsReset: string | null,
  statements: ReturnType<typeof stat>[],
): PerfSnapshot => ({
  schemaVersion: 1,
  toolVersion: '0.2.0',
  takenAt: 't',
  host: 'h',
  statsReset,
  statements,
  tables: [],
})

describe('windowStatements', () => {
  it('takes the delta and the previous mean when the counters continued', () => {
    const window = windowStatements(
      snap('r1', [stat('1', 100, 1000)]),
      snap('r1', [stat('1', 150, 1750, 4)]),
    )
    expect(window).toEqual([
      {
        role: 'service_role',
        queryId: '1',
        text: 'q1',
        calls: 50,
        totalMs: 750,
        tempBlksWritten: 4,
        meanMs: 15,
        previousMeanMs: 10,
      },
    ])
  })
  it('uses absolute values with no previous mean after a reset, for a new statement, or when a counter fell', () => {
    const reset = windowStatements(
      snap('r1', [stat('1', 100, 1000)]),
      snap('r2', [stat('1', 20, 400)]),
    )
    expect(reset[0]).toMatchObject({
      calls: 20,
      totalMs: 400,
      meanMs: 20,
      previousMeanMs: null,
    })
    const fresh = windowStatements(
      snap('r1', []),
      snap('r1', [stat('2', 30, 60)]),
    )
    expect(fresh[0]).toMatchObject({
      calls: 30,
      meanMs: 2,
      previousMeanMs: null,
    })
    const fell = windowStatements(
      snap('r1', [stat('1', 100, 1000)]),
      snap('r1', [stat('1', 90, 900)]),
    )
    expect(fell[0]).toMatchObject({ calls: 90, previousMeanMs: null })
  })
  it('a statement gone from the current reading is not a window', () => {
    expect(
      windowStatements(snap('r1', [stat('1', 100, 1000)]), snap('r1', [])),
    ).toEqual([])
  })
})
