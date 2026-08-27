const HAS_THRESHOLDS = /\bthresholds\s*:|\bcoverageThreshold\s*:/
const HAS_COVERAGE_BLOCK = /\bcoverage\s*:\s*\{/g

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
export function checkCoverageThresholds({ scripts, testConfig }) {
  const findings = []
  const test = scripts.test

  // A monorepo root runs its suites through the workspaces, and its coverage
  // configuration lives in each of them. Judging the root would report the
  // reference implementation as having no tests at all.
  if (delegates(scripts)) {
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

  if (!test) {
    return [
      {
        id: 'coverage',
        level: 'error',
        message: 'no `test` script',
        detail: 'Nothing to measure coverage of.',
      },
    ]
  }

  if (!/--coverage\b/.test(test) && !/\bcoverage\b/.test(test)) {
    findings.push({
      id: 'coverage-run',
      level: 'error',
      message: '`test` does not produce a coverage report',
      detail: 'Without `--coverage` the thresholds below are never evaluated.',
      fix: {
        kind: 'set-script',
        name: 'test',
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

  if (HAS_THRESHOLDS.test(testConfig.text)) return findings

  const coverageBlocks = [...testConfig.text.matchAll(HAS_COVERAGE_BLOCK)]
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

// Whether the project hands its test run to a workspace runner rather than
// running a suite of its own. Matched against every script, not just `test`:
// the baseline repo reaches its suites through `check:ci`, which calls
// `turbo run ... test ...`, and defines no root `test` script at all.
function delegates(scripts) {
  return Object.values(scripts).some(
    (command) =>
      typeof command === 'string' &&
      /\b(?:turbo|nx|lerna)\s+run\s+(?:[\w:-]+\s+)*test\b|(?:pnpm|npm|yarn)\s+(?:-r|--recursive)\s+(?:run\s+)?test\b/.test(
        command,
      ),
  )
}
