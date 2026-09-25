import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { BENCH_RECORD_FILENAME } from '@/bench/BENCH_RECORD_FILENAME.js'
import type { BenchRecord } from '@/bench/BenchRecord.js'
import { readBenchRecord } from '@/bench/readBenchRecord.js'
import { writeBenchRecord } from '@/bench/writeBenchRecord.js'
import { ConfigError } from '@/config/ConfigError.js'

const record: BenchRecord = {
  schemaVersion: 1,
  toolVersion: '0.2.0',
  takenAt: 't',
  host: 'h',
  entries: {
    'a.sql': {
      medianMs: 1,
      minMs: 1,
      runs: 5,
      seqScans: [],
      indexScans: [],
      worstEstimateRatio: 1,
    },
  },
}

describe('bench record file', () => {
  it('round-trips', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeBenchRecord(root, record)
    expect(readBenchRecord(root)).toEqual(record)
    expect(readFileSync(join(root, BENCH_RECORD_FILENAME), 'utf8')).not.toMatch(
      /password|postgres:\/\//,
    )
  })
  it('is undefined when absent', () => {
    expect(readBenchRecord(mkdtempSync(join(tmpdir(), 'dbq-')))).toBeUndefined()
  })
  it('rejects a wrong schema version', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(
      join(root, BENCH_RECORD_FILENAME),
      JSON.stringify({ schemaVersion: 2 }),
    )
    expect(() => readBenchRecord(root)).toThrow(ConfigError)
    expect(() => readBenchRecord(root)).toThrow(/not a version 1 bench record/)
  })
})
