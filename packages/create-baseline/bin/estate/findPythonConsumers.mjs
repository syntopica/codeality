import { readdir, readFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'

const TOOL = 'busirocket-baseline-py'
// The tool's own pyproject names it too; a package is not its own consumer.
const IS_THE_TOOL = /^name = "busirocket-baseline-py"/m
// Directories that never hold a project of ours, and would make the walk
// slow (node_modules), circular (.venv) or pointless (a build tree).
const SKIP = new Set(['node_modules', 'build', 'dist', 'target'])
const MAX_DEPTH = 3

/**
 * Every project under `root` whose pyproject.toml depends on baseline-py.
 *
 * Three levels deep, unlike `findConsumers`: the estate sweep proved that a
 * Python project is often nested inside a repository that is about something
 * else - `parent-repo/tools/nested-tool`, `multi-project-repo/consumer-c` - and a scan
 * of repository roots reported those as having no Python at all.
 *
 * Returns `[{ name, path }]` sorted by name; `name` is the path relative to
 * `root`, so a nested project is reported where it lives.
 */
export async function findPythonConsumers(root) {
  const consumers = []
  await walk(root, root, 0, consumers)
  return consumers.sort((a, b) => a.name.localeCompare(b.name))
}

async function walk(root, dir, depth, consumers) {
  if (depth > MAX_DEPTH) return
  let entries
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  if (depth > 0 && (await dependsOnTool(dir))) {
    consumers.push({ name: relative(root, dir), path: dir })
    return
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue
    if (SKIP.has(entry.name)) continue
    await walk(root, resolve(dir, entry.name), depth + 1, consumers)
  }
}

async function dependsOnTool(dir) {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const text = await readFile(resolve(dir, 'pyproject.toml'), 'utf8')
    return text.includes(TOOL) && !IS_THE_TOOL.test(text)
  } catch {
    return false
  }
}
