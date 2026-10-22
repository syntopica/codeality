// Whether the project hands its test run to a workspace runner rather than
// running a suite of its own. Matched against every script, not just `test`:
// the baseline repo reaches its suites through `check:ci`, which calls
// `turbo run ... test ...`, and defines no root `test` script at all.
export function delegatesCoverageTests(scripts) {
  for (const command of Object.values(scripts)) {
    if (
      typeof command === 'string' &&
      /\b(?:turbo|nx|lerna)\s+run\s+(?:[\w:-]+\s+)*test\b|(?:pnpm|npm|yarn)\s+(?:-r|--recursive)\s+(?:run\s+)?test\b/.test(
        command,
      )
    )
      return true
  }
  return false
}
