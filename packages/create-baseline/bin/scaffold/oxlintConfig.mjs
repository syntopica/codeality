import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

const ownRequire = createRequire(import.meta.url)

const SPECIFIER = '@syntopica/quality-config/oxlint'

// The oxlint pre-filter config, read from @syntopica/quality-config rather
// than restated here. oxlint takes a JSON file, not a factory, so the only way
// to keep one source of truth is to copy the shipped file at scaffold time -
// and to read it from the package, so a change there reaches new projects
// without this file being touched.
//
// Resolved from the project first: under `pnpm dlx` this file lives in the dlx
// cache, where quality-config is not installed, and resolving only from here
// crashed with "Cannot find module" on a project that had it. This package's
// own resolution is the fallback, which is what the monorepo relies on.
export function oxlintConfig(root) {
  let path
  try {
    path = createRequire(join(root, 'package.json')).resolve(SPECIFIER)
  } catch {
    path = ownRequire.resolve(SPECIFIER)
  }
  // The path comes from module resolution of a fixed specifier, not from
  // anything a caller supplies.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return readFileSync(path, 'utf8')
}
