import { RUNNER_BINARIES } from './RUNNER_BINARIES'
import { readScriptWords } from './readScriptWords'

/**
 * The runner dependencies knip cannot see used, and so must be ignored.
 *
 * `baseline-dupes`, `baseline-type-coverage`, `baseline-deps-graph` and
 * `baseline-hooks-install` spawn `jscpd`, `type-coverage`, `depcruise` and
 * `lefthook` themselves, which hides a real dependency from knip. A project
 * that also names the binary in a script (`"prepare": "lefthook install"`,
 * `"deps:graph": "depcruise src"`) lets knip resolve it, and ignoring it then
 * becomes a permanent `Remove from ignoreDependencies` hint no consumer can
 * silence. So only the packages no script names directly are ignored.
 */
export const runnerDependenciesToIgnore = (cwd: string): string[] => {
  const words = readScriptWords(cwd)
  return Object.entries(RUNNER_BINARIES)
    .filter(([, binaries]) => !binaries.some((binary) => words.has(binary)))
    .map(([dependency]) => dependency)
}
