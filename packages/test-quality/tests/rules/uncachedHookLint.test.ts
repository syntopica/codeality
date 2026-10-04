import { describe, expect, it } from 'vitest'

import { uncachedHookLint } from '@/rules/uncachedHookLint.js'

describe('uncachedHookLint', () => {
  it('flags eslint and prettier without a cache in a reached script', () => {
    const findings = uncachedHookLint(
      ['check:ci'],
      { 'check:ci': 'eslint . --max-warnings 0 && prettier --check .' },
      'pre-push',
    )
    expect(findings[0]?.evidence).toEqual([
      'check:ci: eslint without --cache',
      'check:ci: prettier without --cache',
    ])
  })
  // False positives: cached steps, a prettier that only formats a file
  // list in place without checking, and scripts the hook never reaches.
  // The verticagtm check:ci of 2026-10-04, verbatim: its cache path names
  // eslint, which the first version of the rule read as an uncached eslint.
  it('passes a cached script whose cache path names the tool', () => {
    const checkCi =
      'pnpm run type-check && eslint . --max-warnings 0 --cache --cache-strategy content --cache-location node_modules/.cache/eslint/ && prettier --check . --cache --cache-location node_modules/.cache/prettier/.prettier-cache && pnpm run dupes'
    expect(
      uncachedHookLint(['check:ci'], { 'check:ci': checkCi }, 'pre-push'),
    ).toEqual([])
  })
  it('flags a tool run through a runner', () => {
    expect(
      uncachedHookLint(['lint'], { lint: 'pnpm exec eslint src' }, 'pre-push'),
    ).toHaveLength(1)
  })
  it('passes cached steps and scripts the hook does not reach', () => {
    expect(
      uncachedHookLint(
        ['check:ci'],
        {
          'check:ci':
            'eslint . --cache && prettier --check . --cache --cache-location x',
          lint: 'eslint .',
        },
        'pre-push',
      ),
    ).toEqual([])
  })
})
