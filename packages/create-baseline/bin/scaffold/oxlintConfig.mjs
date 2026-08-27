import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// The oxlint pre-filter config, read from @busirocket/quality-config rather
// than restated here. oxlint takes a JSON file, not a factory, so the only way
// to keep one source of truth is to copy the shipped file at scaffold time -
// and to read it from the package, so a change there reaches new projects
// without this file being touched.
export function oxlintConfig() {
  // The path comes from this package's own dependency resolution, not from
  // anything a caller supplies.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return readFileSync(
    require.resolve('@busirocket/quality-config/oxlint'),
    'utf8',
  )
}
