import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { cruise } from 'dependency-cruiser'
import { describe, expect, it } from 'vitest'

import { createDepCruiserConfig } from '../src/dependency-cruiser'

// A module tree where every way of reaching another module's internals is
// present once, beside the one allowed way (its index).
const writeTree = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'qc-modules-'))
  const files: Record<string, string> = {
    'src/features/billing/index.ts': "export { total } from './total'\n",
    'src/features/billing/total.ts': 'export const total = 1\n',
    'src/features/cart/index.ts':
      "export { viaIndex, deep, reexported } from './use'\n",
    'src/features/cart/use.ts': [
      "import { total as viaIndex } from '../billing'",
      "import { total as deep } from '../billing/total'",
      "export { total as reexported } from '../billing/total'",
      "import { helper } from './helper'",
      'export { viaIndex, deep, helper }',
      '',
    ].join('\n'),
    'src/features/cart/helper.ts': 'export const helper = 1\n',
  }
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(dir, path, '..'), { recursive: true })
    writeFileSync(join(dir, path), content)
  }
  return dir
}

describe('moduleRoots', () => {
  it('reports resolved deep imports into another module, not its index or the module itself', async () => {
    const dir = writeTree()
    const config = createDepCruiserConfig({ moduleRoots: ['src/features'] })
    const cwd = process.cwd()
    process.chdir(dir)
    try {
      const result = await cruise(['src'], {
        ruleSet: { forbidden: config.forbidden },
        validate: true,
      })
      const output = result.output as {
        summary: {
          violations: { rule: { name: string }; from: string; to: string }[]
        }
      }
      const deep = output.summary.violations
        .filter((v) => v.rule.name === 'no-deep-cross-module-import')
        .map((v) => `${v.from} -> ${v.to}`)
      expect(deep).toEqual([
        'src/features/cart/use.ts -> src/features/billing/total.ts',
      ])
    } finally {
      process.chdir(cwd)
    }
  })

  it('adds no rule unless module roots are named', () => {
    const names = createDepCruiserConfig().forbidden?.map((rule) => rule.name)
    expect(names).not.toContain('no-deep-cross-module-import')
  })
})
