import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

import { ConfigError } from '@/config/ConfigError.js'
import { isDirectory } from '@/config/isDirectory.js'
import { SKIPPED_SOURCE_DIRS } from '@/postgrest/SKIPPED_SOURCE_DIRS.js'

/** Every .ts/.tsx under the roots, relative to root, tests and declarations excluded, sorted. */
export const sourceFilesUnder = (root: string, roots: string[]): string[] => {
  for (const base of roots) {
    if (!isDirectory(join(root, base)))
      throw new ConfigError(`postgrest.roots: "${base}" is not a directory`)
  }
  const files: string[] = []
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIPPED_SOURCE_DIRS.has(entry.name) && !entry.name.startsWith('.'))
          walk(join(dir, entry.name))
        continue
      }
      const name = entry.name
      if (
        !/\.tsx?$/.test(name) ||
        name.endsWith('.d.ts') ||
        /\.(?:test|spec)\.tsx?$/.test(name)
      )
        continue
      files.push(relative(root, join(dir, name)))
    }
  }
  for (const base of roots) walk(join(root, base))
  return files.sort()
}
