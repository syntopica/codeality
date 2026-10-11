import { describe, expect, it } from 'vitest'

import { hookRunsSuite } from '@/observations/hookRunsSuite.js'

const SCRIPTS = {
  'check:ci': 'eslint .',
  test: 'vitest run --coverage',
  dev: 'vitest --watch',
}

describe('hookRunsSuite', () => {
  it('notes a hook that reaches the lint gate and the suite', () => {
    expect(hookRunsSuite(['check:ci', 'test'], SCRIPTS, 'pre-push')).toEqual([
      expect.objectContaining({
        name: 'hook-runs-full-gate',
      }),
    ])
  })
  it('says nothing about a hook that only lints', () => {
    expect(hookRunsSuite(['check:ci'], SCRIPTS, 'pre-commit')).toEqual([])
  })
})
