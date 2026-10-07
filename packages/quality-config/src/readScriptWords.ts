import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Every word of every `package.json` script in `cwd`, so a caller can ask
 * whether a binary is named anywhere. Unreadable or malformed manifests give
 * an empty set: the caller then ignores the dependency, which is the safe side.
 */
export const readScriptWords = (cwd: string): Set<string> => {
  try {
    const manifest: unknown = JSON.parse(
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed file name under the project root
      readFileSync(join(cwd, 'package.json'), 'utf8'),
    )
    const scripts = (manifest as { scripts?: Record<string, unknown> }).scripts
    const text = Object.values(scripts ?? {})
      .filter((script): script is string => typeof script === 'string')
      .join('\n')
    return new Set(text.split(/[\s;&|()]+/u).filter(Boolean))
  } catch {
    return new Set()
  }
}
