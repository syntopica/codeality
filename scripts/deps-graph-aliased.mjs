#!/usr/bin/env node
// Orphan check for the workspaces that map a path alias through their own
// tsconfig.json "paths". dependency-cruiser takes a single `tsConfig` per
// cruise, so the repo-wide `pnpm deps:graph` cannot resolve more than one of
// these mappings; it excludes these workspaces from `no-orphans` and this run
// is their only orphan authority (see ALIASED_WORKSPACES in
// @busirocket/quality-config/dependency-cruiser).
//
// Aliases are read from each workspace's own tsconfig rather than restated
// here, so a template that renames or adds an alias cannot drift away from what
// this gate resolves.
//
// dependency-cruiser resolves a tsconfig's relative `paths` against the current
// working directory rather than against the config file that declares them. For
// a workspace that declares its aliases in its own root tsconfig those two are
// the same directory and it happens to work; for Nuxt, whose paths live in the
// generated `.nuxt/tsconfig.json` and are written relative to `.nuxt/`, every
// aliased import silently comes back `couldNotResolve` and its targets look
// like orphans. So each cruise gets a generated tsconfig at the workspace root
// with those paths rebased, and it is removed again afterwards.
//
// Usage:
//   node scripts/deps-graph-aliased.mjs

import { spawnSync } from 'node:child_process'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { exit } from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const CONFIG = resolve(REPO_ROOT, '.dependency-cruiser.workspace.cjs')
// Resolved from the repo root rather than left to PATH, so no shell is needed
// to find it and the arguments are never concatenated into a command string.
const DEPCRUISE = resolve(REPO_ROOT, 'node_modules/.bin/depcruise')

// `sources` are relative to the workspace and mirror what the repo-wide run
// would otherwise have cruised there.
const ALIASED_WORKSPACES = [
  { workspace: 'packages/eslint-plugin-code-policy', sources: ['src'] },
  { workspace: 'templates/vue-app', sources: ['src'] },
  { workspace: 'templates/nuxt-app', sources: ['app', 'server'] },
]

// Walks the `extends` chain until it finds the config that declares `paths`,
// and returns it alongside its own directory - the base every relative entry in
// it is written against. Only relative `extends` are followed: a bare specifier
// points at a shared preset, which never declares project-local aliases.
function findPathsDeclaration(configPath) {
  // Repo tooling reading this repo's own configs, not untrusted input.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const config = JSON.parse(readFileSync(configPath, 'utf8'))
  const paths = config.compilerOptions?.paths
  if (paths) return { paths, base: dirname(configPath) }
  const parent = config.extends
  if (typeof parent !== 'string' || !parent.startsWith('.')) return null
  return findPathsDeclaration(resolve(dirname(configPath), parent))
}

// Rewrites every `paths` target so it is relative to the workspace root, which
// is where dependency-cruiser will resolve them from.
function rebasePaths(declaration, root) {
  const rebased = {}
  for (const [pattern, targets] of Object.entries(declaration.paths)) {
    rebased[pattern] = targets.map((target) => {
      if (typeof target !== 'string') return target
      const absolute = resolve(declaration.base, target)
      const fromRoot = relative(root, absolute)
      return fromRoot.startsWith('.') ? fromRoot : `./${fromRoot}`
    })
  }
  return rebased
}

const failed = []

for (const { workspace, sources } of ALIASED_WORKSPACES) {
  const root = resolve(REPO_ROOT, workspace)
  const declaration = findPathsDeclaration(resolve(root, 'tsconfig.json'))
  if (!declaration) {
    console.error(
      `deps:graph:aliased: no tsconfig "paths" reachable from ${workspace}/tsconfig.json. ` +
        'Either the alias was removed - drop this workspace from ALIASED_WORKSPACES and from ' +
        'the exclusion list in @busirocket/quality-config/dependency-cruiser so the repo-wide ' +
        'run checks it again - or the config moved and this lookup needs updating.',
    )
    failed.push(workspace)
    continue
  }

  // Dot-prefixed so the orphan rule's own dotfile exemption covers it if a
  // crash ever leaves one behind; also gitignored for the same reason.
  const generated = resolve(root, '.baseline-depcruise.tsconfig.json')
  console.log(
    `deps:graph:aliased: cruising ${workspace} (${Object.keys(declaration.paths).join(', ')})`,
  )
  // Repo tooling writing into this repo's own workspaces, not untrusted input.
  /* eslint-disable security/detect-non-literal-fs-filename */
  writeFileSync(
    generated,
    JSON.stringify({
      extends: `./${relative(root, resolve(root, 'tsconfig.json'))}`,
      compilerOptions: { paths: rebasePaths(declaration, root) },
    }),
  )
  try {
    const result = spawnSync(
      DEPCRUISE,
      [
        ...sources,
        '--config',
        CONFIG,
        '--ts-config',
        '.baseline-depcruise.tsconfig.json',
      ],
      { cwd: root, stdio: 'inherit' },
    )
    if (result.status !== 0) failed.push(workspace)
  } finally {
    rmSync(generated, { force: true })
  }
  /* eslint-enable security/detect-non-literal-fs-filename */
}

if (failed.length) {
  console.error(`deps:graph:aliased: failed for ${failed.join(', ')}`)
  exit(1)
}

console.log('deps:graph:aliased: no orphans found.')
