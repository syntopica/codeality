import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runBench } from '@/bench/runBench.js'
import { PERF_DEFAULTS } from '@/config/PERF_DEFAULTS.js'
import type { PsqlSession } from '@/postgres/PsqlSessionType.js'

const BENCH_DIR = 'db-quality/bench'

const fixture = (name: string): string =>
  readFileSync(new URL(`../fixtures/bench/${name}`, import.meta.url), 'utf8')

describe('runBench', () => {
  it('warms up, runs N times, takes the median, and compares with the record', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, BENCH_DIR), { recursive: true })
    writeFileSync(
      join(root, `${BENCH_DIR}/by_id.sql`),
      '-- runs: 3\nselect * from t where id = 5;\n',
    )
    const sqls: string[] = []
    const session: PsqlSession = {
      rows: () => [],
      text: (sql) => {
        sqls.push(sql)
        return fixture('seq_scan.json')
      },
    }
    const recorded = {
      schemaVersion: 1 as const,
      toolVersion: '0.2.0',
      takenAt: 't',
      host: 'h',
      entries: {
        'by_id.sql': {
          medianMs: 0.01,
          minMs: 0.01,
          runs: 3,
          seqScans: [],
          indexScans: ['t'],
          worstEstimateRatio: 1,
        },
      },
    }
    const result = runBench(session, root, recorded, {
      perf: PERF_DEFAULTS,
      disabled: [],
    })
    expect(sqls).toHaveLength(4)
    expect(sqls[0]).toBe(
      'explain (analyze, buffers, format json) select * from t where id = 5',
    )
    expect(result.entries['by_id.sql']?.runs).toBe(3)
    // The seq_scan.json fixture measures well under a millisecond on this
    // machine, so BDB911's absolute 5 ms floor never fires against it; that
    // rule is exercised directly (with mocked entries) in benchFindings.test.ts.
    // BDB912 fires: the record's "by_id.sql" only ever hit an index scan, and
    // this run is a sequential scan over the same relation.
    expect(result.findings.map((f) => f.code)).toEqual(['BDB912'])
  })
  it('measures without judging when there is no record', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, BENCH_DIR), { recursive: true })
    writeFileSync(join(root, `${BENCH_DIR}/a.sql`), 'select 1;')
    const session: PsqlSession = {
      rows: () => [],
      text: () => fixture('index_scan.json'),
    }
    const result = runBench(session, root, undefined, {
      perf: PERF_DEFAULTS,
      disabled: [],
    })
    expect(result.findings).toEqual([])
    expect(Object.keys(result.entries)).toEqual(['a.sql'])
  })
  it('records an improvement when the median dropped enough', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, BENCH_DIR), { recursive: true })
    writeFileSync(join(root, `${BENCH_DIR}/a.sql`), '-- runs: 1\nselect 1;')
    const session: PsqlSession = {
      rows: () => [],
      text: () => fixture('index_scan.json'),
    }
    const recorded = {
      schemaVersion: 1 as const,
      toolVersion: '0.2.0',
      takenAt: 't',
      host: 'h',
      entries: {
        'a.sql': {
          medianMs: 100,
          minMs: 100,
          runs: 1,
          seqScans: [],
          indexScans: ['t'],
          worstEstimateRatio: 1,
        },
      },
    }
    const result = runBench(session, root, recorded, {
      perf: PERF_DEFAULTS,
      disabled: [],
    })
    expect(result.improvements).toHaveLength(1)
    expect(result.improvements[0]?.subject).toBe('a.sql')
  })
  it('refuses an empty file and a missing directory', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    const session: PsqlSession = { rows: () => [], text: () => '' }
    expect(() =>
      runBench(session, root, undefined, { perf: PERF_DEFAULTS, disabled: [] }),
    ).toThrow(/db-quality\/bench is not a directory/)
    mkdirSync(join(root, BENCH_DIR), { recursive: true })
    writeFileSync(join(root, `${BENCH_DIR}/empty.sql`), '-- nothing\n')
    expect(() =>
      runBench(session, root, undefined, { perf: PERF_DEFAULTS, disabled: [] }),
    ).toThrow(/empty.sql holds no statement/)
  })
})
