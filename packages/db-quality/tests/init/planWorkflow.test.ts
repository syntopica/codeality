import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { planWorkflow } from '@/init/planWorkflow.js'

describe('planWorkflow', () => {
  it('creates, then is unchanged, then conflicts on a local edit', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    const plan = planWorkflow(root, false)
    expect(plan).toMatchObject({
      disposition: 'create',
      path: '.github/workflows/db-quality.yml',
    })
    mkdirSync(join(root, '.github/workflows'), { recursive: true })
    writeFileSync(
      join(root, '.github/workflows/db-quality.yml'),
      plan.content ?? '',
    )
    expect(planWorkflow(root, false).disposition).toBe('unchanged')
    writeFileSync(
      join(root, '.github/workflows/db-quality.yml'),
      'name: edited\n',
    )
    expect(planWorkflow(root, false).disposition).toBe('conflict')
    expect(planWorkflow(root, true).disposition).toBe('merge')
  })
})
