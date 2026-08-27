import { describe, expect, it } from 'vitest'

import { checkCoverageThresholds } from '../bin/conformance/checkCoverageThresholds.mjs'

const CONFIG = (body) => ({
  name: 'vitest.config.ts',
  path: '/repo/vitest.config.ts',
  text: body,
})

const WITH_THRESHOLDS = CONFIG(`
  test: {
    coverage: {
      provider: 'v8',
      thresholds: { lines: 80 },
    },
  },
`)

const WITHOUT = CONFIG(`
  test: {
    coverage: {
      provider: 'v8',
    },
  },
`)

describe('checkCoverageThresholds', () => {
  it('passes a project that measures and enforces coverage', () => {
    const scripts = { test: 'vitest run --coverage' }
    expect(
      checkCoverageThresholds({ scripts, testConfig: WITH_THRESHOLDS }),
    ).toEqual([])
  })

  // consumer-u: thresholds configured at 80, and a test script that never
  // produces a report for them to be compared against.
  it('reports thresholds that are never evaluated', () => {
    const scripts = { test: 'vitest run' }
    const ids = checkCoverageThresholds({
      scripts,
      testConfig: WITH_THRESHOLDS,
    }).map((f) => f.id)
    expect(ids).toEqual(['coverage-run'])
  })

  it('offers vitest own ratchet rather than a flat floor', () => {
    const scripts = { test: 'vitest run --coverage' }
    const [finding] = checkCoverageThresholds({ scripts, testConfig: WITHOUT })
    expect(finding.id).toBe('coverage-thresholds')
    expect(finding.fix).toEqual({
      kind: 'insert-coverage-thresholds',
      path: '/repo/vitest.config.ts',
    })
  })

  // Two coverage blocks means two projects or environments, and guessing which
  // one owns the gate would silently protect the wrong half.
  it('refuses to guess when the config has more than one coverage block', () => {
    const twice = CONFIG('coverage: {\n}\ncoverage: {\n}\n')
    const scripts = { test: 'vitest run --coverage' }
    const [finding] = checkCoverageThresholds({ scripts, testConfig: twice })
    expect(finding.fix).toBeUndefined()
  })

  it('reports a project with no test-runner config', () => {
    const scripts = { test: 'vitest run --coverage' }
    const ids = checkCoverageThresholds({ scripts, testConfig: null }).map(
      (f) => f.id,
    )
    expect(ids).toEqual(['coverage-thresholds'])
  })

  it('reports a project with no test script', () => {
    const [finding] = checkCoverageThresholds({ scripts: {}, testConfig: null })
    expect(finding.id).toBe('coverage')
  })
})
