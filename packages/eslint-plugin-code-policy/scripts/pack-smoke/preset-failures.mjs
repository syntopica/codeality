import { pathToFileURL } from 'node:url'

import tsParser from '@typescript-eslint/parser'
import { Linter } from 'eslint'

import { DEEP_EDGES } from './DEEP_EDGES.mjs'

// Loads one preset from the installed tarball through both `import` and
// `require`, and lints two deep module edges every preset must report.
export async function presetFailures(requireThere, packageName, preset) {
  const specifier = `${packageName}/configs/${preset}`
  const esm = (
    await import(pathToFileURL(requireThere.resolve(specifier)).href)
  ).default
  const failures = []
  for (const [format, config] of [
    ['esm', esm],
    ['cjs', requireThere(specifier)],
  ]) {
    const messages = new Linter().verify(
      DEEP_EDGES,
      [{ files: ['**/*.ts'], languageOptions: { parser: tsParser } }, config],
      'src/feature/edge.ts',
    )
    const reported = messages.filter(
      (message) => message.ruleId === 'code-policy/public-api-imports',
    )
    if (reported.length !== 2) {
      failures.push(`${preset} (${format}): ${JSON.stringify(messages)}`)
    }
  }
  return failures
}
