import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// The directories a monorepo's workspaces live in, resolved from whichever
// package manager's home for them the repo uses. A repo with neither file is
// not a monorepo and gets an empty list.
//
// Only globs one level deep are followed, which is where pnpm and npm
// workspaces put packages in practice: `apps/*`, `packages/*`. A deeper or
// wilder pattern is skipped rather than half-matched.
export async function workspaceRoots(root) {
  const globs = await workspaceGlobs(root)
  const roots = []
  for (const glob of globs) {
    const [group] = glob.split('/')
    if (!group || group.startsWith('.') || group.includes('*')) continue
    let entries
    try {
      // A path under the project this CLI was invoked against, which is the
      // tool's job to read - not untrusted input.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      entries = await readdir(resolve(root, group), { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (entry.isDirectory()) roots.push(resolve(root, group, entry.name))
    }
  }
  return roots
}

async function workspaceGlobs(root) {
  try {
    const manifest = JSON.parse(
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      await readFile(resolve(root, 'package.json'), 'utf8'),
    )
    if (Array.isArray(manifest.workspaces)) return manifest.workspaces
    if (Array.isArray(manifest.workspaces?.packages)) {
      return manifest.workspaces.packages
    }
  } catch {
    /* no manifest, or not JSON: fall through to pnpm's file */
  }
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const raw = await readFile(resolve(root, 'pnpm-workspace.yaml'), 'utf8')
    return pnpmPackages(raw)
  } catch {
    return []
  }
}

// One list item under `packages:`. Anchored at both ends and with a capture
// that admits no whitespace, so no quantifier here can exchange characters
// with its neighbour.
const LIST_ITEM = /^[ \t]*-[ \t]*['"]?([^'"\s]+)['"]?[ \t]*$/

// The `packages:` block of a pnpm workspace file, read line by line rather
// than matched as one block.
//
// The block regex this replaces was `/^packages:\n((?:\s*-.*\n?)+)/m`, whose
// `\s*` and `.*` can exchange characters - exponential backtracking on a file
// this tool reads in every repository it visits. Rewriting it to be linear is
// possible but delicate; a loop over lines has no backtracking to reason
// about at all, and says what it does.
function pnpmPackages(raw) {
  const globs = []
  let inBlock = false

  for (const line of raw.split('\n')) {
    if (!inBlock) {
      if (line.trimEnd() === 'packages:') inBlock = true
      continue
    }
    const item = LIST_ITEM.exec(line)
    if (item) {
      globs.push(item[1])
      continue
    }
    // A blank line or a comment sits inside the block; anything else is the
    // next top-level key and ends it.
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue
    break
  }

  return globs
}
