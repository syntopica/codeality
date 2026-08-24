#!/usr/bin/env node
// Runs dependency-cruiser once per workspace, each with its own tsconfig.
//
// A single repo-wide cruise takes one `tsConfig`, so in a monorepo where each
// workspace maps `@/*` through its own config it can resolve at most one of
// them. Every alias in every other workspace comes back `couldNotResolve`, and
// `no-orphans` then reports whatever it could not follow. Cruising per
// workspace gives each one the config that actually describes it.
//
// Usage:
//   baseline-deps-graph                       # src, app, server, lib
//   baseline-deps-graph src app               # only these
//   baseline-deps-graph --config path.cjs src
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { argv, cwd, exit } from 'node:process'

const DEFAULT_SOURCES = ['src', 'app', 'server', 'lib']
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

const args = argv.slice(2)
const configIndex = args.indexOf('--config')
const configPath = resolve(
  cwd(),
  configIndex === -1
    ? '.dependency-cruiser.cjs'
    : (args[configIndex + 1] ?? ''),
)
const sources = (
  configIndex === -1
    ? args
    : [...args.slice(0, configIndex), ...args.slice(configIndex + 2)]
).filter(Boolean)
const sourceDirectories = sources.length ? sources : DEFAULT_SOURCES

// Every path below is derived from the invoking project's own tree, which is
// the point of this tool - not untrusted input.
/* eslint-disable security/detect-non-literal-fs-filename */
if (!existsSync(configPath)) {
  console.error(
    `baseline-deps-graph: no dependency-cruiser config at ${relative(cwd(), configPath)}. ` +
      'Pass one with --config.',
  )
  exit(1)
}

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

const failed = []
for (const workspace of findWorkspaces(cwd())) {
  const present = sourceDirectories.filter((directory) =>
    existsSync(resolve(workspace, directory)),
  )
  if (!present.length) continue

  const label = relative(cwd(), workspace) || '.'
  console.log(`deps-graph: cruising ${label} (${present.join(', ')})`)
  const result = spawnSync(
    'pnpm',
    [
      'exec',
      'depcruise',
      ...present,
      '--config',
      configPath,
      '--ts-config',
      'tsconfig.json',
    ],
    { cwd: workspace, stdio: 'inherit' },
  )
  if (result.status !== 0) failed.push(label)
}
/* eslint-enable security/detect-non-literal-fs-filename */

if (failed.length) {
  console.error(`deps-graph: failed for ${failed.join(', ')}`)
  exit(1)
}
console.log('deps-graph: no violations found.')
