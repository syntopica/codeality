import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { planConfigFile } from '@/init/planConfigFile.js'

describe('planConfigFile', () => {
  it('creates the file from the detected stacks', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'supabase/migrations'), { recursive: true })
    const plan = planConfigFile(root, false)
    expect(plan.disposition).toBe('create')
    expect(JSON.parse(plan.content ?? '')).toEqual({
      schemaVersion: 1,
      supabase: { migrations: 'supabase/migrations' },
    })
  })
  it('leaves a valid file alone and flags an invalid one', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(join(root, 'codeality-db.json'), '{"schemaVersion":1}')
    expect(planConfigFile(root, false).disposition).toBe('unchanged')
    writeFileSync(join(root, 'codeality-db.json'), '{"schemaVersion":9}')
    expect(planConfigFile(root, false)).toMatchObject({
      disposition: 'conflict',
      detail: 'schemaVersion must be 1',
    })
    expect(planConfigFile(root, true).disposition).toBe('merge')
  })
})
