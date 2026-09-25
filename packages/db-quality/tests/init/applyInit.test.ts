import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { applyInit } from '@/init/applyInit.js'
import { planInit } from '@/init/planInit.js'
import { renderInitPlan } from '@/init/renderInitPlan.js'

describe('applyInit', () => {
  it('writes only create and merge entries', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    const plan = planInit(root, false)
    expect(renderInitPlan(plan).split('\n')[0]).toBe(
      'create     codeality-db.json  from the detected stacks',
    )
    applyInit(root, plan)
    expect(readFileSync(join(root, 'codeality-db.json'), 'utf8')).toContain(
      '"schemaVersion": 1',
    )
    expect(existsSync(join(root, '.github/workflows/db-quality.yml'))).toBe(
      true,
    )
    expect(existsSync(join(root, 'package.json'))).toBe(false)
    expect(
      planInit(root, false).every((file) => file.disposition === 'unchanged'),
    ).toBe(true)
  })
})
