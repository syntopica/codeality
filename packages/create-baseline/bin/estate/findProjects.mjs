import { readdir } from 'node:fs/promises'
import { relative, resolve } from 'node:path'

// Directories that never hold a project of ours, and would make the walk
// slow (node_modules), circular (.venv) or pointless (a build tree).
const SKIP = new Set(['node_modules', 'build', 'dist', 'target'])

/**
 * Every directory under `root`, up to `maxDepth` levels down, for which
 * `isProject(dir)` resolves true. The walk stops descending at a project,
 * and never enters dot- or underscore-prefixed directories.
 *
 * Returns `[{ name, path }]` sorted by name; `name` is the path relative to
 * `root`, so a nested project is reported where it lives.
 */
export async function findProjects(root, isProject, { maxDepth = 3 } = {}) {
  const projects = []
  const walk = async (dir, depth) => {
    if (depth > maxDepth) return
    let entries
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    if (depth > 0 && (await isProject(dir))) {
      projects.push({ name: relative(root, dir), path: dir })
      return
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || /^[._]/.test(entry.name)) continue
      if (SKIP.has(entry.name)) continue
      await walk(resolve(dir, entry.name), depth + 1)
    }
  }
  await walk(root, 0)
  return projects.sort((a, b) => a.name.localeCompare(b.name))
}
