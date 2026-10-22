#!/usr/bin/env node
// Orphan check for the workspaces that map a path alias through their own
// tsconfig.json "paths". dependency-cruiser takes a single `tsConfig` per
// cruise, so the repo-wide `pnpm deps:graph` cannot resolve more than one of
// these mappings; it excludes these workspaces from `no-orphans` and this run
// is their only orphan authority. Both halves read the same list from
// `scripts/aliasedWorkspaces.mjs`, so neither can drift from the other.
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

import { dirname, resolve } from 'node:path'
import { exit } from 'node:process'
import { fileURLToPath } from 'node:url'

import { withCruiseTsconfig } from '@syntopica/quality-config/cruise-tsconfig'
import { spawnCruise } from '../packages/quality-config/bin/spawnCruise.mjs'

import { ALIASED_WORKSPACES } from './aliasedWorkspaces.mjs'

export function runAliasedDependencyGraphs() {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const REPO_ROOT = resolve(__dirname, '..')
  const CONFIG = resolve(REPO_ROOT, '.dependency-cruiser.workspace.cjs')
  // Resolved from the repo root rather than left to PATH, so no shell is needed
  // to find it and the arguments are never concatenated into a command string.
  const DEPCRUISE = resolve(REPO_ROOT, 'node_modules/.bin/depcruise')

  const failed = []

  for (const { workspace, sources } of ALIASED_WORKSPACES) {
    const root = resolve(REPO_ROOT, workspace)
    console.log(`deps:graph:aliased: cruising ${workspace}`)
    try {
      const result = withCruiseTsconfig(
        resolve(root, 'tsconfig.json'),
        spawnCruise.bind(
          null,
          DEPCRUISE,
          [...sources, '--config', CONFIG],
          root,
        ),
        { requirePaths: true },
      )
      if (result.status !== 0) failed.push(workspace)
    } catch (error) {
      console.error(`deps:graph:aliased: ${workspace}: ${String(error)}`)
      failed.push(workspace)
    }
  }

  if (failed.length) {
    console.error(`deps:graph:aliased: failed for ${failed.join(', ')}`)
    exit(1)
  }

  console.log('deps:graph:aliased: no orphans found.')
}

runAliasedDependencyGraphs()
