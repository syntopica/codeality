import { readdirSync } from 'node:fs'

import { detectFileKind } from '@/utils/detect-file-kind.js'
import { isComponentFilename } from '@/utils/is-component-filename.js'

// A placement-checked unit (hook, mapper, formatter, ...) is "colocated" when
// it sits next to the unit that consumes it, rather than orphaned in a purely
// technical folder. The containing folder counts as a colocation home when it
// holds an "anchor" alongside the file: a public-API barrel (index.*), a
// component (PascalCase .tsx/.jsx), or any other code file that is itself not a
// placement-checked kind (the neighbouring consumer — a service function, a
// page, a constant, etc.). Modern feature-folder guidance keeps a
// single-consumer hook or util beside its consumer; only shared units graduate
// to a dedicated hooks//mappers/ folder, so an anchored folder is exempt.
export function hasColocationAnchor(
  dir: string,
  selfBasename: string,
): boolean {
  let entries: readonly { name: string; isFile: boolean }[]
  try {
    // `dir` is the directory of the file ESLint is already linting, not
    // untrusted input — reading its siblings is the whole point of the rule.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    entries = readdirSync(dir, { withFileTypes: true }).map((entry) => ({
      name: entry.name,
      isFile: entry.isFile(),
    }))
  } catch {
    // Directory not readable (virtual filename, race, permissions): stay safe
    // and do not claim an anchor, so placement remains enforced.
    return false
  }

  for (const entry of entries) {
    if (!entry.isFile) continue
    const name = entry.name
    if (name === selfBasename) continue
    if (!/\.(?:tsx?|jsx?)$/.test(name)) continue

    // Public-API barrel anchors the folder as a module.
    if (/^index\.(?:tsx?|jsx?)$/.test(name)) return true

    // A component file (PascalCase .tsx/.jsx) anchors the folder as a feature.
    if (isComponentFilename(name)) return true

    // A neighbouring code file that is not itself a placement-checked kind is
    // the consumer the unit is colocated with.
    if (detectFileKind(name) === null) return true
  }

  return false
}
