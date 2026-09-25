import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { PERF_SNAPSHOT_FILENAME } from '@/perf/PERF_SNAPSHOT_FILENAME.js'
import type { PerfSnapshot } from '@/perf/PerfSnapshot.js'
import { readPerfSnapshot } from '@/perf/readPerfSnapshot.js'
import { writePerfSnapshot } from '@/perf/writePerfSnapshot.js'

const snapshot: PerfSnapshot = {
  schemaVersion: 1,
  toolVersion: '0.2.0',
  takenAt: 't',
  host: 'h',
  statsReset: null,
  statements: [],
  tables: [],
}

describe('perf snapshot file', () => {
  it('round-trips and never holds anything but the host', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writePerfSnapshot(root, snapshot)
    expect(readPerfSnapshot(root)).toEqual(snapshot)
    expect(
      readFileSync(join(root, PERF_SNAPSHOT_FILENAME), 'utf8'),
    ).not.toMatch(/password|postgres:\/\//)
  })
  it('names the command that creates it when absent', () => {
    expect(() => readPerfSnapshot(mkdtempSync(join(tmpdir(), 'dbq-')))).toThrow(
      /run "codeality-db perf snapshot"/,
    )
  })
})
