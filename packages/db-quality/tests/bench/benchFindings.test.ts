import { describe, expect, it } from 'vitest'

import type { BenchEntry } from '@/bench/BenchEntry.js'
import { benchFindings } from '@/bench/benchFindings.js'
import { PERF_DEFAULTS } from '@/config/PERF_DEFAULTS.js'

const entry = (
  medianMs: number,
  seqScans: { relation: string; rows: number }[] = [],
  indexScans: string[] = [],
  worstEstimateRatio = 1,
): BenchEntry => ({
  medianMs,
  minMs: medianMs,
  runs: 5,
  seqScans,
  indexScans,
  worstEstimateRatio,
})

const input = { file: 'a.sql', benchDir: 'bench' }
const judgement = { perf: PERF_DEFAULTS, disabled: [] }

describe('benchFindings', () => {
  it('BDB911 needs both the percentage and five milliseconds', () => {
    expect(
      benchFindings(input, entry(100), entry(125), judgement).map(
        (f) => f.code,
      ),
    ).toEqual(['BDB911'])
    expect(benchFindings(input, entry(1), entry(1.5), judgement)).toEqual([])
    expect(benchFindings(input, entry(100), entry(110), judgement)).toEqual([])
  })
  it('BDB912 on a new sequential scan over a big table or over a relation that had an index scan', () => {
    expect(
      benchFindings(
        input,
        entry(1, [], ['t']),
        entry(1, [{ relation: 't', rows: 10 }]),
        judgement,
      ).map((f) => f.code),
    ).toEqual(['BDB912'])
    expect(
      benchFindings(
        input,
        entry(1),
        entry(1, [{ relation: 'u', rows: 20000 }]),
        judgement,
      ).map((f) => f.code),
    ).toEqual(['BDB912'])
    expect(
      benchFindings(
        input,
        entry(1, [{ relation: 'u', rows: 20000 }]),
        entry(1, [{ relation: 'u', rows: 20000 }]),
        judgement,
      ),
    ).toEqual([])
    expect(
      benchFindings(
        input,
        entry(1),
        entry(1, [{ relation: 'u', rows: 10 }]),
        judgement,
      ),
    ).toEqual([])
  })
  it('BDB913 needs no record and points at the file', () => {
    const findings = benchFindings(
      input,
      undefined,
      entry(1, [], [], 250),
      judgement,
    )
    expect(findings.map((f) => [f.code, f.path, f.line])).toEqual([
      ['BDB913', 'bench/a.sql', 1],
    ])
  })
  it('honors the disable list', () => {
    expect(
      benchFindings(input, entry(100), entry(125), {
        perf: PERF_DEFAULTS,
        disabled: [{ code: 'BDB911', reason: 'known' }],
      }),
    ).toEqual([])
  })
})
