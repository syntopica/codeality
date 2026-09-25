import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { PERF_INIT_SECTION } from '@/init/PERF_INIT_SECTION.js'
import { planConfigFile } from '@/init/planConfigFile.js'

describe('planConfigFile', () => {
  it('creates a schemaVersion 2 file from the detected stacks', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'supabase/migrations'), { recursive: true })
    const plan = planConfigFile(root, false)
    expect(plan.disposition).toBe('create')
    expect(JSON.parse(plan.content ?? '')).toEqual({
      schemaVersion: 2,
      supabase: { migrations: 'supabase/migrations' },
      perf: PERF_INIT_SECTION,
    })
  })
  it('upgrades a valid schemaVersion 1 file to 2, objectifying disable entries', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(
      join(root, 'codeality-db.json'),
      JSON.stringify({ schemaVersion: 1, disable: ['BDB001'] }),
    )
    const plan = planConfigFile(root, false)
    expect(plan).toMatchObject({
      disposition: 'merge',
      detail: 'upgraded to schemaVersion 2',
    })
    const content = JSON.parse(plan.content ?? '') as {
      schemaVersion: number
      disable: Array<{ code: string; reason: string }>
    }
    expect(content.schemaVersion).toBe(2)
    expect(content.disable[0]).toMatchObject({ code: 'BDB001' })
  })
  it('leaves a valid schemaVersion 2 file alone and flags an invalid one', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(join(root, 'codeality-db.json'), '{"schemaVersion":2}')
    expect(planConfigFile(root, false).disposition).toBe('unchanged')
    writeFileSync(join(root, 'codeality-db.json'), '{"schemaVersion":9}')
    expect(planConfigFile(root, false)).toMatchObject({
      disposition: 'conflict',
      detail: 'schemaVersion must be 1 or 2',
    })
    expect(planConfigFile(root, true).disposition).toBe('merge')
  })
})
