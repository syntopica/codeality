import { describe, expect, it } from 'vitest'

import type { BenchRecord } from '@/bench/BenchRecord.js'
import type { BenchResult } from '@/bench/BenchResult.js'
import { renderBench } from '@/bench/renderBench.js'
import { renderBenchJson } from '@/bench/renderBenchJson.js'

const entry = (medianMs: number, indexScans: string[] = []) => ({
  medianMs,
  minMs: medianMs,
  runs: 5,
  seqScans: [],
  indexScans,
  worstEstimateRatio: 1,
})

const result: BenchResult = {
  entries: {
    'by_id.sql': entry(0.42),
    'list_open.sql': entry(12.1),
  },
  findings: [
    {
      code: 'BDB912',
      severity: 'error',
      path: 'db-quality/bench/by_id.sql',
      line: 1,
      message:
        'sequential scan over 20,000 rows of "t" where the record had an index scan',
      subject: 't',
      fingerprint: 'f1',
    },
  ],
  improvements: [
    {
      subject: 'list_open.sql',
      previousMs: 18.6,
      currentMs: 12.1,
      calls: 5,
      savedMs: 6.5,
    },
  ],
}

const recorded: BenchRecord = {
  schemaVersion: 1,
  toolVersion: '0.2.0',
  takenAt: 't',
  host: 'h',
  entries: { 'by_id.sql': entry(0.4) },
}

describe('renderBench', () => {
  it('renders the summary, the improvements block and every finding', () => {
    expect(renderBench(result, recorded)).toBe(
      [
        'bench (5 runs each)',
        '  by_id.sql      0.42 ms   (record 0.40 ms)',
        '  list_open.sql  12.10 ms   (no record)',
        'improvements',
        '  -35%   18.60 ms -> 12.10 ms  list_open.sql',
        'db-quality/bench/by_id.sql:1: BDB912 sequential scan over 20,000 rows of "t" where the record had an index scan (t)',
        '1 findings',
      ].join('\n'),
    )
  })
  it('omits the improvements block and marks every entry as unrecorded without a record', () => {
    const noImprovements: BenchResult = { ...result, improvements: [] }
    expect(renderBench(noImprovements, undefined)).toBe(
      [
        'bench (5 runs each)',
        '  by_id.sql      0.42 ms   (no record)',
        '  list_open.sql  12.10 ms   (no record)',
        'db-quality/bench/by_id.sql:1: BDB912 sequential scan over 20,000 rows of "t" where the record had an index scan (t)',
        '1 findings',
      ].join('\n'),
    )
  })
  it('prints the runs per line when the files ran a different number of times', () => {
    const mixed: BenchResult = {
      entries: { 'a.sql': entry(1), 'b.sql': { ...entry(2), runs: 20 } },
      findings: [],
      improvements: [],
    }
    expect(renderBench(mixed, undefined).split('\n').slice(0, 3)).toEqual([
      'bench (runs per file)',
      '  a.sql  1.00 ms   (no record)   5 runs',
      '  b.sql  2.00 ms   (no record)   20 runs',
    ])
  })
})

describe('renderBenchJson', () => {
  it('renders schemaVersion 1 with the entries, the record and the findings, pretty-printed', () => {
    expect(JSON.parse(renderBenchJson(result, recorded))).toEqual({
      schemaVersion: 1,
      entries: result.entries,
      recorded: recorded.entries,
      improvements: result.improvements,
      findings: result.findings,
    })
  })
  it('records null when there is no reference', () => {
    expect(JSON.parse(renderBenchJson(result, undefined))).toMatchObject({
      recorded: null,
    })
  })
})
