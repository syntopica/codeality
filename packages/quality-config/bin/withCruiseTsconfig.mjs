import { randomUUID } from 'node:crypto'
import { closeSync, openSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { readCruiseCompilerOptions } from './readCruiseCompilerOptions.mjs'
import { rebaseCruisePaths } from './rebaseCruisePaths.mjs'
import { runSynchronousCruise } from './runSynchronousCruise.mjs'

export function withCruiseTsconfig(
  configPath,
  operation,
  { requirePaths = false } = {},
) {
  const original = resolve(configPath)
  const compilerOptions = rebaseCruisePaths(readCruiseCompilerOptions(original))
  if (!compilerOptions) {
    if (requirePaths)
      throw new Error(`No TypeScript paths reachable from ${original}`)
    return runSynchronousCruise(operation, original)
  }
  // The same directory preserves TypeScript's implicit include location.
  const generated = join(
    dirname(original),
    `.baseline-depcruise-${randomUUID()}.json`,
  )
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- A random filename stays beside the parsed tsconfig; wx rejects preexisting paths.
  const descriptor = openSync(generated, 'wx', 0o600)
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- descriptor is the numeric fd from the exclusive open above, not a filename.
    writeFileSync(
      descriptor,
      JSON.stringify({ extends: original, compilerOptions }),
    )
    return runSynchronousCruise(operation, generated)
  } finally {
    try {
      closeSync(descriptor)
    } finally {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- This filename was created by the successful exclusive open and is cleaned in finally.
      unlinkSync(generated)
    }
  }
}
