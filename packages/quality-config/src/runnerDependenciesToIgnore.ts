import { hasLefthookConfig } from './hasLefthookConfig'
import { readScriptWords } from './readScriptWords'
import { RUNNER_BINARIES } from './RUNNER_BINARIES'

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
 *
 * `lefthook` is also resolved by knip's own Lefthook plugin whenever a
 * Lefthook configuration file exists, so it is ignored only without one.
 */
export const runnerDependenciesToIgnore = (cwd: string): string[] => {
  const words = readScriptWords(cwd)
  const lefthookConfigured = hasLefthookConfig(cwd)
  return Object.entries(RUNNER_BINARIES)
    .filter(([, binaries]) => !binaries.some((binary) => words.has(binary)))
    .filter(
      ([dependency]) => !(dependency === 'lefthook' && lefthookConfigured),
    )
    .map(([dependency]) => dependency)
}
