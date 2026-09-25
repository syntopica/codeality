import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { env } from 'node:process'

import { afterEach, describe, expect, it } from 'vitest'

import { BENCH_RECORD_FILENAME } from '@/bench/BENCH_RECORD_FILENAME.js'
import { configFromDocument } from '@/config/configFromDocument.js'
import { perfStage } from '@/gate/perfStage.js'
import { PERF_SNAPSHOT_FILENAME } from '@/perf/PERF_SNAPSHOT_FILENAME.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

const runner: CommandRunner = () => ({
  status: 0,
  stdout: '[]',
  stderr: '',
  missing: false,
})

const linkedRoot = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'dbq-'))
  mkdirSync(join(root, 'supabase/.temp'), { recursive: true })
  writeFileSync(
    join(root, 'supabase/.temp/pooler-url'),
    'postgres://u:p@db.example.com/d',
  )
  return root
}

describe('perfStage', () => {
  afterEach(() => {
    delete env['SUPABASE_DB_PASSWORD']
  })

  it('is not applicable when perf.inGate is false', () => {
    const config = configFromDocument({
      schemaVersion: 2,
      perf: { inGate: false },
    })
    expect(perfStage({ root: '/p', config, runner }).run()).toBe(
      'not-applicable',
    )
  })
  it('says why it skipped without a target, and without state files', () => {
    const config = configFromDocument({
      schemaVersion: 2,
      perf: { inGate: true },
    })
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    expect(perfStage({ root, config, runner }).run()).toEqual({
      skipped: 'no --db-url and no linked project with SUPABASE_DB_PASSWORD',
    })
  })
  it('says why it skipped without a snapshot or a bench record', () => {
    env['SUPABASE_DB_PASSWORD'] = 'pw'
    const config = configFromDocument({
      schemaVersion: 2,
      perf: { inGate: true },
    })
    const root = linkedRoot()
    expect(perfStage({ root, config, runner }).run()).toEqual({
      skipped:
        'no perf snapshot and no bench record; run "perf snapshot" or "perf bench --record"',
    })
  })
  it('diffs the snapshot when one exists, and reports no findings', () => {
    env['SUPABASE_DB_PASSWORD'] = 'pw'
    const config = configFromDocument({
      schemaVersion: 2,
      perf: { inGate: true },
    })
    const root = linkedRoot()
    writeFileSync(
      join(root, PERF_SNAPSHOT_FILENAME),
      JSON.stringify({
        schemaVersion: 1,
        toolVersion: '0',
        takenAt: 't0',
        host: 'db.example.com',
        statsReset: 'r',
        statements: [],
        tables: [],
      }),
    )
    const infoRunner: CommandRunner = (_c, args) => {
      const sql = args.at(-1) ?? ''
      return {
        status: 0,
        stdout: sql.includes('_info') ? '[{"stats_reset":"r"}]' : '[]',
        stderr: '',
        missing: false,
      }
    }
    expect(perfStage({ root, config, runner: infoRunner }).run()).toEqual([])
  })
  it('benches the recorded queries when a bench record exists', () => {
    env['SUPABASE_DB_PASSWORD'] = 'pw'
    const config = configFromDocument({
      schemaVersion: 2,
      perf: { inGate: true },
    })
    const root = linkedRoot()
    mkdirSync(join(root, 'db-quality/bench'), { recursive: true })
    writeFileSync(join(root, 'db-quality/bench/a.sql'), 'select 1;')
    writeFileSync(
      join(root, BENCH_RECORD_FILENAME),
      JSON.stringify({
        schemaVersion: 1,
        toolVersion: '0',
        takenAt: 't0',
        host: 'db.example.com',
        entries: {},
      }),
    )
    const explainRunner: CommandRunner = (_c, args) => {
      const sql = args.at(-1) ?? ''
      return {
        status: 0,
        stdout: sql.includes('dbq.plan')
          ? '[{"Plan":{"Node Type":"Result","Plan Rows":1,"Actual Rows":1,"Actual Loops":1},"Execution Time":0.5}]'
          : '[]',
        stderr: '',
        missing: false,
      }
    }
    expect(perfStage({ root, config, runner: explainRunner }).run()).toEqual([])
  })
})
