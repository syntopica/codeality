import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { assetPath } from '@/assetPath.js'
import { planWorkflow } from '@/init/planWorkflow.js'

const relative = '.github/workflows/db-quality.yml'

const fixturePath = fileURLToPath(
  new URL('../fixtures/init/db-quality-0.1.0.yml', import.meta.url),
)

const withWorkflow = (content: string): string => {
  const root = mkdtempSync(join(tmpdir(), 'dbq-'))
  mkdirSync(join(root, '.github/workflows'), { recursive: true })
  writeFileSync(join(root, relative), content)
  return root
}

describe('planWorkflow', () => {
  it('creates, then is unchanged, then conflicts on a local edit', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    const plan = planWorkflow(root, false)
    expect(plan).toMatchObject({ disposition: 'create', path: relative })
    mkdirSync(join(root, '.github/workflows'), { recursive: true })
    writeFileSync(join(root, relative), plan.content ?? '')
    expect(planWorkflow(root, false).disposition).toBe('unchanged')
    writeFileSync(join(root, relative), 'name: edited\n')
    expect(planWorkflow(root, false).disposition).toBe('conflict')
    expect(planWorkflow(root, true).disposition).toBe('merge')
  })

  it('upgrades a workflow it shipped as 0.1.0 without --force', () => {
    const root = withWorkflow(readFileSync(fixturePath, 'utf8'))
    const plan = planWorkflow(root, false)
    expect(plan.disposition).toBe('merge')
    expect(plan.detail).toBe('upgraded from the 0.1.0 workflow')
    expect(plan.content).toBe(readFileSync(assetPath('db-quality.yml'), 'utf8'))
  })

  it('still conflicts on a locally edited workflow', () => {
    const root = withWorkflow('name: edited\n')
    expect(planWorkflow(root, false).disposition).toBe('conflict')
  })
})
