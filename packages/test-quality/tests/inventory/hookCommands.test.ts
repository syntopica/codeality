import { describe, expect, it } from 'vitest'

import { hookCommands } from '@/inventory/hookCommands.js'
import { scriptsReachedFrom } from '@/inventory/scriptsReachedFrom.js'

const LEFTHOOK = `pre-commit:
  commands:
    lint:
      run: pnpm exec eslint {staged_files}
pre-push:
  piped: true
  commands:
    secrets:
      run: gitleaks detect --no-banner
    verify:
      run: pnpm run check:ci && pnpm run test
`

describe('hookCommands', () => {
  it('reads only the named hook from lefthook.yml', () => {
    expect(hookCommands('pre-push', LEFTHOOK, undefined)).toEqual([
      'gitleaks detect --no-banner',
      'pnpm run check:ci && pnpm run test',
    ])
  })
  it('reads a husky script, skipping comments and blank lines', () => {
    expect(
      hookCommands('pre-push', undefined, '#!/bin/sh\n\nnpm test\n'),
    ).toEqual(['npm test'])
  })
})

describe('scriptsReachedFrom', () => {
  it('follows scripts that call scripts, once each', () => {
    const scripts = {
      'check:ci': 'pnpm run type-check && eslint . && pnpm run check:ci',
      'type-check': 'tsc --noEmit',
      test: 'vitest run',
      lint: 'eslint .',
    }
    expect(
      scriptsReachedFrom(
        ['pnpm run check:ci && pnpm run test'],
        scripts,
      ).sort(),
    ).toEqual(['check:ci', 'test', 'type-check'])
  })
})
