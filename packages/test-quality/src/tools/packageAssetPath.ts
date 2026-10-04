import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * A file under the package's `assets/`, found by walking up from this module:
 * the bundle sits in `dist/` and the source two levels deeper in `src/tools/`.
 */
export const packageAssetPath = (name: string): string => {
  let dir = dirname(fileURLToPath(import.meta.url))
  while (!existsSync(join(dir, 'assets', name))) {
    const parent = dirname(dir)
    if (parent === dir) throw new Error(`asset not found: ${name}`)
    dir = parent
  }
  return join(dir, 'assets', name)
}
