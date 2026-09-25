import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { summarizeExplain } from '@/bench/summarizeExplain.js'

const fixture = (name: string): string =>
  readFileSync(new URL(`../fixtures/bench/${name}`, import.meta.url), 'utf8')

describe('summarizeExplain', () => {
  it('reads the execution time and the index scan', () => {
    const summary = summarizeExplain(fixture('index_scan.json'))
    expect(summary.executionMs).toBeGreaterThan(0)
    expect(summary.indexScans).toEqual(['t'])
    expect(summary.seqScans).toEqual([])
  })
  it('reads a sequential scan with the rows it touched', () => {
    const summary = summarizeExplain(fixture('seq_scan.json'))
    expect(summary.seqScans).toEqual([{ relation: 't', rows: 20000 }])
    expect(summary.worstEstimateRatio).toBe(0)
  })
  it('rejects output that is not an explain document', () => {
    expect(() => summarizeExplain('[]')).toThrow(/not an EXPLAIN document/)
  })
  it('ignores a node whose plan or actual rows are zero when scoring the estimate', () => {
    const document = JSON.stringify([
      {
        Plan: {
          'Node Type': 'Result',
          'Plan Rows': 0,
          'Actual Rows': 0,
          'Actual Loops': 1,
        },
        'Execution Time': 0.1,
      },
    ])
    expect(summarizeExplain(document).worstEstimateRatio).toBe(0)
  })
  it('ignores a node whose plan and actual rows are both under the material-rows floor', () => {
    const document = JSON.stringify([
      {
        Plan: {
          'Node Type': 'Seq Scan',
          'Relation Name': 't',
          'Plan Rows': 290,
          'Actual Rows': 2,
          'Actual Loops': 1,
        },
        'Execution Time': 0.1,
      },
    ])
    expect(summarizeExplain(document).worstEstimateRatio).toBe(0)
  })
  it('scores a node whose actual rows alone cross the material-rows floor', () => {
    const document = JSON.stringify([
      {
        Plan: {
          'Node Type': 'Seq Scan',
          'Relation Name': 't',
          'Plan Rows': 10,
          'Actual Rows': 5000,
          'Actual Loops': 1,
        },
        'Execution Time': 0.1,
      },
    ])
    expect(summarizeExplain(document).worstEstimateRatio).toBeGreaterThan(100)
  })
  it('walks nested plan nodes, collecting every scan and the worst estimate', () => {
    const document = JSON.stringify([
      {
        Plan: {
          'Node Type': 'Nested Loop',
          'Plan Rows': 1,
          'Actual Rows': 1,
          'Actual Loops': 1,
          Plans: [
            {
              'Node Type': 'Seq Scan',
              'Relation Name': 'a',
              'Plan Rows': 1,
              'Actual Rows': 10,
              'Actual Loops': 1,
              'Rows Removed by Filter': 90,
            },
            {
              'Node Type': 'Bitmap Heap Scan',
              'Relation Name': 'b',
              'Plan Rows': 1,
              'Actual Rows': 2000,
              'Actual Loops': 1,
            },
          ],
        },
        'Execution Time': 1.5,
      },
    ])
    const summary = summarizeExplain(document)
    expect(summary.seqScans).toEqual([{ relation: 'a', rows: 100 }])
    expect(summary.indexScans).toEqual(['b'])
    expect(summary.worstEstimateRatio).toBeGreaterThan(1)
  })
})
