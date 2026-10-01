import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

import { isDirectory } from '@/config/isDirectory.js'
import { SKIPPED_SOURCE_DIRS } from '@/postgrest/SKIPPED_SOURCE_DIRS.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

/** Every `.sql` file under the directories, as sorted root-relative paths. */
export const queryFilesUnder = (root: string, paths: string[]): string[] => {
  for (const base of paths) {
    if (!isDirectory(join(root, base)))
      throw new ConfigError(
        `sqlite.queries.paths: "${base}" is not a directory`,
      )
  }
  const found = new Set<string>()
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const path = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!SKIPPED_SOURCE_DIRS.has(entry.name)) walk(path)
      } else if (entry.isFile() && entry.name.endsWith('.sql')) {
        found.add(relative(root, path).replaceAll('\\', '/'))
      }
    }
  }
  for (const base of paths) walk(join(root, base))
  return [...found].sort()
}
