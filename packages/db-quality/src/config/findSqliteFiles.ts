import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

/** SQLite files at depth <= 2 under the root, as sorted root-relative paths. */
export const findSqliteFiles = (root: string): string[] => {
  const skipped = new Set([
    'node_modules',
    '.git',
    '.codegraph',
    '.cocoindex_code',
    'dist',
    'coverage',
  ])
  const found: string[] = []
  const walk = (directory: string, depth: number): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (skipped.has(entry.name)) continue
      const path = join(directory, entry.name)
      if (entry.isDirectory() && depth < 2) walk(path, depth + 1)
      else if (entry.isFile() && /\.(?:db|sqlite|sqlite3)$/.test(entry.name)) {
        found.push(relative(root, path).replaceAll('\\', '/'))
      }
    }
  }
  walk(root, 0)
  return found.sort()
}
