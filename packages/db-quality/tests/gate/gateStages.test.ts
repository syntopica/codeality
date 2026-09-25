import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { configFromDocument } from '@/config/configFromDocument.js'
import { gateStages } from '@/gate/gateStages.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

const runner: CommandRunner = () => ({
  status: 0,
  stdout: '{"results":[],"rows":[]}',
  stderr: '',
  missing: false,
})

describe('gateStages', () => {
  it('uses check without a baseline and baseline-check with one', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    const config = configFromDocument({ schemaVersion: 1 })
    expect(gateStages({ root, config, runner }).map((s) => s.name)).toEqual([
      'check',
      'audit',
    ])
    expect(gateStages({ root, config, runner })[0]?.run()).toEqual([])
    writeFileSync(
      join(root, '.codeality-db-baseline.json'),
      '{"schemaVersion":1,"toolVersion":"0","entries":[]}',
    )
    const stages = gateStages({ root, config, runner })
    expect(stages[0]?.name).toBe('baseline-check')
    expect(stages[0]?.run()).toEqual([])
  })
  it('marks audit not applicable when unlinked or switched off, and runs it when linked', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    const on = configFromDocument({ schemaVersion: 1 })
    expect(gateStages({ root, config: on, runner })[1]?.run()).toBe(
      'not-applicable',
    )
    mkdirSync(join(root, 'supabase/.temp'), { recursive: true })
    writeFileSync(join(root, 'supabase/.temp/project-ref'), 'abc')
    expect(gateStages({ root, config: on, runner })[1]?.run()).toEqual([])
    const off = configFromDocument({
      schemaVersion: 1,
      audit: { inGate: false },
    })
    expect(gateStages({ root, config: off, runner })[1]?.run()).toBe(
      'not-applicable',
    )
  })
})
