import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { MAX_CRUISE_DEPTH } from './maxCruiseDepth.mjs'
import { SKIPPED_CRUISE_DIRECTORIES } from './skippedCruiseDirectories.mjs'

export function findCruiseWorkspaces(root, depth = 0) {
  const found = []
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- root starts at the invoking project's cwd and recurses through directory entries.
  if (existsSync(resolve(root, 'tsconfig.json'))) found.push(root)
  if (depth >= MAX_CRUISE_DEPTH) return found
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- The selected project is read recursively; isDirectory excludes symlink entries below.
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || SKIPPED_CRUISE_DIRECTORIES.has(entry.name))
      continue
    found.push(...findCruiseWorkspaces(resolve(root, entry.name), depth + 1))
  }
  return found
}
