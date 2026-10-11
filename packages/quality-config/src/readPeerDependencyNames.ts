import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The `peerDependencies` names of the package `name` as installed under
 * `cwd`'s `node_modules`; a package that is not installed gives none.
 */
export const readPeerDependencyNames = (
  cwd: string,
  name: string,
): string[] => {
  try {
    const manifest = JSON.parse(
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- a listed dependency's manifest under the project's node_modules
      readFileSync(join(cwd, 'node_modules', name, 'package.json'), 'utf8'),
    ) as { peerDependencies?: Record<string, string> }
    return Object.keys(manifest.peerDependencies ?? {})
  } catch {
    return []
  }
}
