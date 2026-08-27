import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

/**
 * The parsed `package.json` of a project directory.
 *
 * Throws if there is none, or if it is not JSON. Callers decide what that
 * means: the scaffolder treats it as "not a project", the conformance check
 * treats it as a hard stop.
 */
export async function readManifest(root) {
  // `root` is the directory this CLI was invoked against, or a workspace of
  // it - reading its manifest is the tool's job, not untrusted input.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const raw = await readFile(resolve(root, 'package.json'), 'utf8')
  return JSON.parse(raw)
}
