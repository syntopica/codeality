#!/usr/bin/env node
// Runs the cross-file quality gates in order, naming the step that fails.
//
// This was a chain of `pnpm a && pnpm b && ...`. That reports the right exit
// code and nothing else: a CI summary, a hook, or a `pnpm check:quality`
// scrolled past shows only "failed with exit code 1", and the step that
// produced it has to be recovered by reading the log. The gate failed once on
// a cold run and passed on every run after, and the aggregate exit code is why
// that report could never be acted on.
//
// Same semantics as the chain it replaces: steps run in order and the first
// failure stops the run, with that step's exit code.
//
// Usage:
//   node scripts/check-quality.mjs
import { spawnSync } from 'node:child_process'
import { exit } from 'node:process'

// Each step is a script in this package.json. They are named here rather than
// inlined so the failure banner can print the one to re-run.
const STEPS = [
  'knip',
  'knip:templates',
  'deps:graph',
  'deps:graph:aliased',
  'type-coverage',
  'publish:check',
]

for (const step of STEPS) {
  console.log(`\ncheck:quality: running  ${step}`)
  const result = spawnSync('pnpm', ['run', step], { stdio: 'inherit' })

  if (result.error) {
    console.error(
      `\ncheck:quality: FAIL     ${step} - could not start: ${result.error.message}`,
    )
    exit(1)
  }
  if (result.signal) {
    console.error(
      `\ncheck:quality: FAIL     ${step} - killed by ${result.signal}`,
    )
    exit(1)
  }
  if (result.status !== 0) {
    console.error(
      `\ncheck:quality: FAIL     ${step} (exit ${result.status})\n` +
        `Re-run just this step with \`pnpm run ${step}\`.`,
    )
    exit(result.status ?? 1)
  }
}

console.log(`\ncheck:quality: ${STEPS.length} gates passed.`)
