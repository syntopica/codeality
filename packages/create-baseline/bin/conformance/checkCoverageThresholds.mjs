import { coverageBlockPattern } from './coverageBlockPattern.mjs'
import { coverageTestScripts } from './coverageTestScripts.mjs'
import { coverageThresholdPattern } from './coverageThresholdPattern.mjs'
import { delegatesCoverageTests } from './delegatesCoverageTests.mjs'

/**
 * Coverage has to be measured, and the measurement has to fail a build.
 *
 * Every template sets `thresholds: { lines: 80, functions: 80, branches: 80,
 * statements: 80 }` in its vitest config. No adopter did - the invariant only
 * ever existed for projects scaffolded from scratch, because this tool wrote
 * package scripts and never touched a test-runner config. Fifteen of
 * seventeen did not even pass `--coverage`, so the number was not being
 * produced, let alone enforced.
 *
 * The `--fix` for a missing threshold block writes `autoUpdate: true` with a
 * floor of zero rather than a flat 80. That is vitest's own ratchet: the first
 * run with `--coverage` raises every threshold to the level the suite actually
 * reaches and writes it back to the config, and from then on the number can
 * only go up. Entering an existing repository at 80 would turn fifteen
 * builds red on the first day, and a gate that starts red gets deleted rather
 * than met.
 */
export function checkCoverageThresholds(context) {
  const { scripts, testConfig } = context
  const findings = []
  const tests = coverageTestScripts(context)

  // A monorepo root runs its suites through the workspaces, and its coverage
  // configuration lives in each of them. Judging the root would report the
  // reference implementation as having no tests at all.
  if (delegatesCoverageTests(scripts)) {
    return [
      {
        id: 'coverage',
        level: 'info',
        message: 'tests run through workspaces',
        detail:
          'Coverage is configured per workspace; this check cannot see them ' +
          'from the root. Run the conformance check inside each workspace.',
      },
    ]
  }

  if (!tests.length) {
    return [
      {
        id: 'coverage',
        level: 'error',
        message: 'no coverage test script',
        detail:
          'Expected a `test` script or a Vitest/Jest script reachable from CI.',
      },
    ]
  }

  for (const [name, test] of tests) {
    const measures =
      name === 'test'
        ? /--coverage\b|\bcoverage\b/.test(test)
        : /(?:^|\s)--coverage(?:=true)?(?:\s|$)/.test(test) &&
          !/(?:^|\s)--coverage(?:\.enabled)?(?:=|\s+)false(?:\s|$)/.test(
            test,
          ) &&
          !/(?:^|\s)--no-coverage(?:\.enabled)?(?:\s|$|=)/.test(test)
    if (measures) continue
    findings.push({
      id: 'coverage-run',
      level: 'error',
      message: `\`${name}\` does not produce a coverage report`,
      detail: 'Without `--coverage` the thresholds below are never evaluated.',
      fix: {
        kind: 'set-script',
        name,
        value: `${test.trim()} --coverage`,
      },
    })
  }

  if (!testConfig) {
    findings.push({
      id: 'coverage-thresholds',
      level: 'error',
      message: 'no test-runner config to hold coverage thresholds',
      detail:
        'Expected one of vitest.config.*, vite.config.* or jest.config.*.',
    })
    return findings
  }

  if (coverageThresholdPattern.test(testConfig.text)) return findings

  const coverageBlocks = [...testConfig.text.matchAll(coverageBlockPattern)]
  findings.push({
    id: 'coverage-thresholds',
    level: 'error',
    message: `no coverage thresholds in ${testConfig.name}`,
    detail:
      'Coverage is reported and ignored. Add a `thresholds` block with ' +
      '`autoUpdate: true` and a floor of 0: the next run sets every value to ' +
      'what the suite reaches today, and it can only rise from there.',
    // Exactly one `coverage: {` is required for the automatic edit. Two means
    // the file configures more than one project or environment, and guessing
    // which one owns the gate would silently protect the wrong half.
    fix:
      coverageBlocks.length === 1
        ? { kind: 'insert-coverage-thresholds', path: testConfig.path }
        : undefined,
  })
  return findings
}
