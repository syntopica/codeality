import { ciEntrypoints } from './ciEntrypoints.mjs'
import { expandScripts } from './expandScripts.mjs'
import { isCoverageTestCommand } from './isCoverageTestCommand.mjs'

// Preserve the conventional test contract; otherwise inspect only named
// runner commands CI reaches, never unrelated release or Rust test scripts.
export function coverageTestScripts({
  scripts,
  workflows = [],
  runners = {},
  testConfig,
}) {
  if (scripts.test) return [['test', scripts.test]]

  const fromCi = ciEntrypoints(workflows, scripts)
  const entries = fromCi.length
    ? fromCi
    : ['check:ci', 'check:quality', 'check:security']
  const { names } = expandScripts(scripts, entries, runners)
  const tests = []
  for (const name of names) {
    const command = scripts[name] ?? ''
    if (isCoverageTestCommand(command, testConfig)) tests.push([name, command])
  }
  return tests
}
