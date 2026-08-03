#!/usr/bin/env node
// Non-`any` type coverage for every workspace that has its own tsconfig.json.
//
// The threshold is read from `@busirocket/quality-config/type-coverage` through
// jiti rather than restated here, so the published constant and the gate that
// enforces it cannot drift.
//
// Two categories of file are excluded, and only these two:
//   - framework build output (`.next/`, `.nuxt/`), which is generated and whose
//     `any`s belong to the generator, not to this repository;
//   - tests, where casting a rule or a mock to `any` is the point.
// Everything else counts. `--strict` is on: an `any` reached through a generic
// argument counts as uncovered, which is what caught NestJS's
// `INestApplication<any>`.
//
// Usage:
//   node scripts/type-coverage.mjs

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { exit } from 'node:process'
import { fileURLToPath } from 'node:url'

import { createJiti } from 'jiti'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const jiti = createJiti(import.meta.url)
const { TYPE_COVERAGE_THRESHOLD } = await jiti.import(
  '@busirocket/quality-config/type-coverage',
)

const IGNORED_FILES = ['.next/**', '.nuxt/**', 'tests/**', '**/*.test.*']

function findWorkspaces() {
  const roots = []
  for (const group of ['packages', 'templates']) {
    const groupDir = resolve(REPO_ROOT, group)
    // `group` is one of the two literals above, not untrusted input.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    for (const entry of readdirSync(groupDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const workspace = resolve(groupDir, entry.name)
      // `workspace` is a directory listed from this repo's own tree.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (existsSync(resolve(workspace, 'tsconfig.json'))) roots.push(workspace)
    }
  }
  return roots
}

let failed = false
for (const workspace of findWorkspaces()) {
  const label = relative(REPO_ROOT, workspace)
  const result = spawnSync(
    'pnpm',
    [
      'exec',
      'type-coverage',
      '--strict',
      '--at-least',
      String(TYPE_COVERAGE_THRESHOLD),
      ...IGNORED_FILES.flatMap((glob) => ['--ignore-files', glob]),
    ],
    { cwd: workspace, encoding: 'utf8' },
  )
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
  const summary = output.split('\n').at(-2) ?? output
  if (result.status === 0) {
    console.log(`type-coverage: ok    ${label}  ${summary}`)
    continue
  }
  failed = true
  console.error(`type-coverage: FAIL  ${label}`)
  console.error(output)
}

if (failed) {
  console.error(
    `\nEvery workspace must reach ${TYPE_COVERAGE_THRESHOLD}% non-\`any\` coverage.\n` +
      'Run `pnpm exec type-coverage --strict --detail` in the failing workspace to see where.',
  )
  exit(1)
}
console.log(
  `type-coverage: every workspace is at or above ${TYPE_COVERAGE_THRESHOLD}%.`,
)
