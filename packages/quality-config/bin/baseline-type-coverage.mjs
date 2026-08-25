#!/usr/bin/env node
// Runs `type-coverage` in every workspace that has its own tsconfig.json.
//
// The threshold lives in one place - `TYPE_COVERAGE_THRESHOLD` in
// src/type-coverage.ts - and is read from there rather than restated here, so
// the published constant and the gate that enforces it cannot drift. The file
// is a single exported number by design; if that ever stops being true this
// exits rather than guessing.
//
// Two categories of file are excluded, and only these two: framework build
// output, whose `any`s belong to the generator, and tests, where casting a mock
// to `any` is the point. `--strict` is on, so an `any` reached through a
// generic argument counts as uncovered.
//
// `--at-least <n>` lowers the bar for one repo. It exists for adoption: a
// codebase below the shared threshold cannot wire this gate at all otherwise,
// so the choice is an unenforced gate or none. Freezing at the measured value
// makes coverage a ratchet - it cannot fall - and the number in package.json
// is the debt, visible in every diff that changes it. Raise it as the `any`s
// go; never lower it to get green.
//
// Usage:
//   baseline-type-coverage                  # every workspace under the cwd
//   baseline-type-coverage packages         # only under these directories
//   baseline-type-coverage --at-least 97    # freeze below the shared bar
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { argv, cwd, exit } from 'node:process'
import { fileURLToPath } from 'node:url'

const IGNORED_FILES = ['.next/**', '.nuxt/**', 'tests/**', '**/*.test.*']
const SKIPPED_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  'target',
  '.git',
  '.next',
  '.nuxt',
  '.output',
  '.astro',
])
const MAX_DEPTH = 3

// This package's own source, resolved from this file's URL.
// eslint-disable-next-line security/detect-non-literal-fs-filename
const thresholdSource = readFileSync(
  fileURLToPath(new URL('../src/type-coverage.ts', import.meta.url)),
  'utf8',
)
const declared = /TYPE_COVERAGE_THRESHOLD\s*=\s*(\d+)/.exec(thresholdSource)
if (!declared?.[1]) {
  console.error(
    'baseline-type-coverage: could not read TYPE_COVERAGE_THRESHOLD from ' +
      'src/type-coverage.ts. The constant moved or changed shape; this bin ' +
      'reads it from there so the two cannot drift.',
  )
  exit(1)
}
// A repo-local floor, when the project is still climbing toward the shared one.
const atLeastIndex = argv.indexOf('--at-least')
const override = atLeastIndex === -1 ? undefined : argv[atLeastIndex + 1]
if (atLeastIndex !== -1 && !/^\d+(\.\d+)?$/.test(override ?? '')) {
  console.error(
    'baseline-type-coverage: --at-least needs a number, e.g. `--at-least 97`.',
  )
  exit(1)
}
if (override !== undefined && Number(override) > Number(declared[1])) {
  console.error(
    `baseline-type-coverage: --at-least ${override} is above the shared ` +
      `threshold of ${declared[1]}. Drop the flag rather than restating it.`,
  )
  exit(1)
}
const threshold = override ?? declared[1]

// Every path below is derived from the invoking project's own tree, which is
// the point of this tool - not untrusted input.
/* eslint-disable security/detect-non-literal-fs-filename */
function findWorkspaces(root, depth = 0) {
  const found = []
  if (existsSync(resolve(root, 'tsconfig.json'))) found.push(root)
  if (depth >= MAX_DEPTH) return found

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || SKIPPED_DIRECTORIES.has(entry.name)) continue
    found.push(...findWorkspaces(resolve(root, entry.name), depth + 1))
  }
  return found
}
/* eslint-enable security/detect-non-literal-fs-filename */

const roots = argv
  .slice(2)
  .filter((argument, index, all) => {
    if (argument === '--at-least') return false
    return all[index - 1] !== '--at-least'
  })
  .map((argument) => resolve(cwd(), argument))
const workspaces = (roots.length ? roots : [cwd()]).flatMap((root) =>
  findWorkspaces(root),
)

if (!workspaces.length) {
  console.error(
    'baseline-type-coverage: no workspace with a tsconfig.json found. Pass the ' +
      'directories to search, e.g. `baseline-type-coverage packages apps`.',
  )
  exit(1)
}

let failed = false
for (const workspace of workspaces) {
  const label = relative(cwd(), workspace) || '.'
  const result = spawnSync(
    'pnpm',
    [
      'exec',
      'type-coverage',
      '--strict',
      '--at-least',
      threshold,
      ...IGNORED_FILES.flatMap((glob) => ['--ignore-files', glob]),
    ],
    { cwd: workspace, encoding: 'utf8' },
  )
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
  if (result.status === 0) {
    console.log(
      `type-coverage: ok    ${label}  ${output.split('\n').at(-2) ?? output}`,
    )
    continue
  }
  failed = true
  console.error(`type-coverage: FAIL  ${label}`)
  console.error(output)
}

if (failed) {
  console.error(
    `\nEvery workspace must reach ${threshold}% non-\`any\` coverage` +
      (override === undefined
        ? '.\n'
        : ` (this project's own floor; the shared bar is ${declared[1]}%).\n`) +
      'Run `pnpm exec type-coverage --strict --detail` in the failing workspace to see where.',
  )
  exit(1)
}
console.log(
  `type-coverage: every workspace is at or above ${threshold}% (${workspaces.length} checked).`,
)
