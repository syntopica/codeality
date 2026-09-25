import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { planPackageScript } from '@/init/planPackageScript.js'

describe('planPackageScript', () => {
  it('appends the script, keeps the others, detects the three states', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(
      join(root, 'package.json'),
      '{\n  "name": "x",\n  "scripts": {\n    "test": "vitest"\n  }\n}\n',
    )
    const plan = planPackageScript(root, false)
    expect(plan.disposition).toBe('merge')
    expect(
      (JSON.parse(plan.content ?? '') as { scripts: unknown }).scripts,
    ).toEqual({
      test: 'vitest',
      'db:gate': 'codeality-db gate',
    })
    writeFileSync(join(root, 'package.json'), plan.content ?? '')
    expect(planPackageScript(root, false).disposition).toBe('unchanged')
    writeFileSync(
      join(root, 'package.json'),
      '{"scripts":{"db:gate":"something else"}}',
    )
    expect(planPackageScript(root, false).disposition).toBe('conflict')
    expect(planPackageScript(root, true).disposition).toBe('merge')
  })
  it('is unchanged without a package.json', () => {
    expect(
      planPackageScript(mkdtempSync(join(tmpdir(), 'dbq-')), false),
    ).toMatchObject({
      disposition: 'unchanged',
      detail: 'no package.json',
    })
  })
})
