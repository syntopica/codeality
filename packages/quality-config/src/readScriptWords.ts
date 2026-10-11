import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { isScriptInvocation } from './isScriptInvocation'

/**
 * Every word of every `package.json` script in `cwd`, so a caller can ask
 * whether a binary is named anywhere. A word that only runs another script
 * (`pnpm type-coverage` where a `type-coverage` script exists) is left out:
 * it names the script, not the binary. Unreadable or malformed manifests give
 * an empty set: the caller then ignores the dependency, which is the safe side.
 */
export const readScriptWords = (cwd: string): Set<string> => {
  try {
    const manifest: unknown = JSON.parse(
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed file name under the project root
      readFileSync(join(cwd, 'package.json'), 'utf8'),
    )
    const scripts =
      (manifest as { scripts?: Record<string, unknown> }).scripts ?? {}
    const scriptNames = new Set(Object.keys(scripts))
    const words = new Set<string>()
    for (const script of Object.values(scripts)) {
      if (typeof script !== 'string') continue
      const tokens = script.split(/[\s;&|()]+/u).filter(Boolean)
      tokens.forEach((word, index) => {
        if (!isScriptInvocation(word, tokens[index - 1], scriptNames)) {
          words.add(word)
        }
      })
    }
    return words
  } catch {
    return new Set()
  }
}
