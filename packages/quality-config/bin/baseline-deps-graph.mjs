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
import { existsSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { argv, cwd, exit } from 'node:process'
import { cruiseWorkspaceSelection } from './cruiseWorkspaceSelection.mjs'
import { DEFAULT_CRUISE_SOURCES } from './defaultCruiseSources.mjs'
import { findCruiseWorkspaces } from './findCruiseWorkspaces.mjs'
import { parseCruiseArguments } from './parseCruiseArguments.mjs'
import { pnpmCommand } from './pnpmCommand.mjs'
import { presentCruiseSources } from './presentCruiseSources.mjs'
import { spawnCruise } from './spawnCruise.mjs'
import { withCruiseTsconfig } from './withCruiseTsconfig.mjs'

export function runDependencyGraphs() {
  const { configPath, sources, cwdOnly } = parseCruiseArguments(
    argv.slice(2),
    cwd(),
  )
  const sourceDirectories = sources.length ? sources : DEFAULT_CRUISE_SOURCES

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

  const [pnpm, ...pnpmArgs] = pnpmCommand()

  const failed = []
  for (const workspace of cruiseWorkspaceSelection(
    cwd(),
    cwdOnly,
    findCruiseWorkspaces,
  )) {
    const present = presentCruiseSources(workspace, sourceDirectories)
    if (
      cwdOnly &&
      sources.length > 0 &&
      present.length !== sourceDirectories.length
    ) {
      console.error(`deps-graph: missing explicit source in ${workspace}`)
      failed.push(relative(cwd(), workspace) || '.')
      continue
    }
    if (!present.length) continue

    const label = relative(cwd(), workspace) || '.'
    console.log(`deps-graph: cruising ${label} (${present.join(', ')})`)
    try {
      const result = withCruiseTsconfig(
        resolve(workspace, 'tsconfig.json'),
        spawnCruise.bind(
          null,
          pnpm,
          [
            ...pnpmArgs,
            'exec',
            'depcruise',
            ...present,
            '--config',
            configPath,
          ],
          workspace,
        ),
      )
      if (result.status !== 0) failed.push(label)
    } catch (error) {
      console.error(`deps-graph: ${label}: ${String(error)}`)
      failed.push(label)
    }
  }
  /* eslint-enable security/detect-non-literal-fs-filename */

  if (failed.length) {
    console.error(`deps-graph: failed for ${failed.join(', ')}`)
    exit(1)
  }
  console.log('deps-graph: no violations found.')
}

runDependencyGraphs()
