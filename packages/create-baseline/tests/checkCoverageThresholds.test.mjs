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
  it('diagnoses the reachable unit suite without declaring coverage complete', () => {
    const scripts = {
      'check:ci': 'pnpm check:all',
      'check:all': 'pnpm test:unit && pnpm test:release && pnpm cargo:test',
      'test:unit': 'vitest run',
      'test:release': 'node --test release.test.mjs',
      'cargo:test': 'cargo test --workspace',
    }
    const findings = checkCoverageThresholds({
      scripts,
      testConfig: CONFIG('test: { environment: "jsdom" }'),
    })
    expect(findings.map(({ id }) => id)).toEqual([
      'coverage-run',
      'coverage-thresholds',
    ])
    expect(findings.every(({ level }) => level === 'error')).toBe(true)
    expect(findings[0].fix).toEqual({
      kind: 'set-script',
      name: 'test:unit',
      value: 'vitest run --coverage',
    })
  })

  it('recognizes a named runner invoked directly by CI', () => {
    expect(
      checkCoverageThresholds({
        scripts: { 'test:unit': 'pnpm exec vitest run --coverage' },
        workflows: [{ text: 'run: pnpm test:unit' }],
        testConfig: WITH_THRESHOLDS,
      }),
    ).toEqual([])
  })

  it('follows local runners and terminates cyclic script references', () => {
    expect(
      checkCoverageThresholds({
        scripts: {
          'check:ci': 'node scripts/ci.mjs',
          cycle: 'pnpm check:ci && pnpm test:unit',
          'test:unit': 'jest --coverage',
        },
        runners: { 'scripts/ci.mjs': 'pnpm cycle' },
        testConfig: {
          name: 'jest.config.js',
          path: '/repo/jest.config.js',
          text: 'coverageThreshold: { global: { lines: 80 } }',
        },
      }),
    ).toEqual([])
  })

  it('does not borrow coverage from an unreachable suite', () => {
    const findings = checkCoverageThresholds({
      scripts: {
        'check:ci': 'pnpm test:release',
        'test:release': 'node --test release.test.mjs',
        'test:unit': 'vitest run --coverage',
      },
      testConfig: WITH_THRESHOLDS,
    })
    expect(findings.map(({ id }) => id)).toEqual(['coverage'])
    expect(findings[0].level).toBe('error')
  })

  it('does not infer a runner from a script name or an echo', () => {
    const findings = checkCoverageThresholds({
      scripts: {
        'check:ci': 'pnpm test:unit && pnpm cargo:test',
        'test:unit': 'echo vitest --coverage',
        'cargo:test': 'cargo test --workspace',
      },
      testConfig: WITH_THRESHOLDS,
    })
    expect(findings.map(({ id }) => id)).toEqual(['coverage'])
  })

  it('checks every reachable runner rather than borrowing a sibling flag', () => {
    const findings = checkCoverageThresholds({
      scripts: {
        'check:ci': 'pnpm test:unit && pnpm test:integration',
        'test:unit': 'vitest run --coverage',
        'test:integration': 'vitest run',
      },
      testConfig: WITH_THRESHOLDS,
    })
    expect(findings).toHaveLength(1)
    expect(findings[0].fix.name).toBe('test:integration')
  })
  it.each([
    'vitest run --config other.config.ts --coverage',
    'jest -c other.config.js --coverage',
    'jest -cother.config.js --coverage',
    'vitest --root other --coverage',
    'vitest -r other --coverage',
    'vitest -rother --coverage',
    'vitest --dir=other --coverage',
    'vitest --project other --coverage',
    'vitest --workspace=other --coverage',
    'vitest run && echo --coverage',
    'vitest run --coverage $FLAGS',
    'vitest run --coverage `flags`',
  ])('leaves ambiguous command ownership unproven: %s', (command) => {
    const findings = checkCoverageThresholds({
      scripts: { 'check:ci': 'pnpm test:unit', 'test:unit': command },
      testConfig: WITH_THRESHOLDS,
    })
    expect(findings.map(({ id }) => id)).toEqual(['coverage'])
    expect(findings[0].level).toBe('error')
  })

  it.each([
    'vitest run --coverage=false',
    'vitest run coverage.test.ts',
    'vitest run --coverage --coverage=false',
    'vitest run --coverage --coverage.enabled=false',
    'vitest run --coverage=false --coverage',
    'vitest run --coverage --no-coverage',
    'vitest run --coverage --no-coverage.enabled',
  ])(
    'does not treat a disabled flag or filename as coverage: %s',
    (command) => {
      const findings = checkCoverageThresholds({
        scripts: { 'check:ci': 'pnpm test:unit', 'test:unit': command },
        testConfig: WITH_THRESHOLDS,
      })
      expect(findings.map(({ id }) => id)).toEqual(['coverage-run'])
    },
  )
  it('does not borrow thresholds from another test runner config', () => {
    const findings = checkCoverageThresholds({
      scripts: { 'check:ci': 'pnpm test:unit', 'test:unit': 'jest --coverage' },
      testConfig: WITH_THRESHOLDS,
    })
    expect(findings.map(({ id }) => id)).toEqual(['coverage'])
    expect(findings[0].level).toBe('error')
  })
})
