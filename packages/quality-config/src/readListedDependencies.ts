import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The names in `dependencies` and `devDependencies` of `cwd`'s
 * `package.json`; an unreadable or malformed manifest gives none.
 */
export const readListedDependencies = (cwd: string): string[] => {
  try {
    const manifest = JSON.parse(
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed file name under the project root
      readFileSync(join(cwd, 'package.json'), 'utf8'),
    ) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    return [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.devDependencies ?? {}),
    ]
  } catch {
    return []
  }
}
