import { describe, expect, it } from 'vitest'

import { checkLintFlag } from '../bin/conformance/checkLintFlag.mjs'

describe('checkLintFlag', () => {
  it('passes a lint script that fails on warnings', () => {
    expect(
      checkLintFlag({ scripts: { lint: 'eslint src --max-warnings 0' } }),
    ).toEqual([])
  })

  it('accepts the flag in --max-warnings=0 form', () => {
    expect(
      checkLintFlag({ scripts: { lint: 'eslint . --max-warnings=0' } }),
    ).toEqual([])
  })

  it('reports a missing flag and offers to append it', () => {
    const [finding] = checkLintFlag({ scripts: { lint: 'eslint src' } })
    expect(finding.id).toBe('lint-flag')
    expect(finding.level).toBe('error')
    expect(finding.fix).toEqual({
      kind: 'set-script',
      name: 'lint',
      value: 'eslint src --max-warnings 0',
    })
  })

  // The estate had exactly one of these: a budget frozen at the day's warning
  // count, which reads as configured and can only ever be raised.
  it('reports a numeric budget separately and rewrites it to zero', () => {
    const [finding] = checkLintFlag({
      scripts: { lint: 'eslint . --max-warnings 399' },
    })
    expect(finding.message).toContain('399')
    expect(finding.fix.value).toBe('eslint . --max-warnings 0')
  })

  it('does not mistake a 0 budget for a numeric one', () => {
    expect(
      checkLintFlag({ scripts: { lint: 'eslint . --max-warnings 0' } }),
    ).toEqual([])
  })

  // A monorepo root carries the flag in each workspace, not here. Reporting it
  // would be a false positive on every repo that fans out.
  it('does not judge a delegating script', () => {
    const [finding] = checkLintFlag({ scripts: { lint: 'turbo run lint' } })
    expect(finding.level).toBe('info')
  })

  it('reports a project with no lint script at all', () => {
    const [finding] = checkLintFlag({ scripts: {} })
    expect(finding.id).toBe('lint-script')
    expect(finding.level).toBe('error')
  })
})
