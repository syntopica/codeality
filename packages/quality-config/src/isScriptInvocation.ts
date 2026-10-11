import { SCRIPT_RUNNERS } from './SCRIPT_RUNNERS'

/**
 * Whether `word` names a `package.json` script that the previous word runs.
 * `"check:quality": "pnpm type-coverage"` runs the `type-coverage` script, not
 * the `type-coverage` binary, and knip resolves it that way, so reading it as
 * a use of the binary would leave the package neither ignored nor used.
 */
export const isScriptInvocation = (
  word: string,
  previous: string | undefined,
  scriptNames: ReadonlySet<string>,
): boolean =>
  previous !== undefined &&
  SCRIPT_RUNNERS.has(previous) &&
  scriptNames.has(word)
