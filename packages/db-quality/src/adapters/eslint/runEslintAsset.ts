import type { EslintAssetRun } from '@/adapters/eslint/EslintAssetRun.js'
import { parseEslintReport } from '@/adapters/eslint/parseEslintReport.js'
import { assetPath } from '@/assetPath.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

// Runs from the project root: ESLint ignores any file outside its cwd, which
// is what an earlier attempt from another directory reported as "all files
// matching the pattern are ignored".
// `--no-config-lookup` does not stop ESLint reading the project's own
// eslint-suppressions.json, and an entry there that no longer matches makes
// it exit 2 with no report; the flag turns that into a pass (measured on a
// project whose suppressions had gone stale, 2026-09-25).
export const runEslintAsset = (
  runner: CommandRunner,
  root: string,
  run: EslintAssetRun,
  disabled: DisableEntry[],
): Finding[] => {
  const result = runner(
    'eslint',
    [
      '--no-config-lookup',
      '-c',
      assetPath(run.asset),
      '-f',
      'json',
      '--pass-on-unpruned-suppressions',
      ...run.roots,
    ],
    { cwd: root, env: run.env },
  )
  if (result.missing) throw new ToolMissingError('eslint', run.installHint)
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(
      `eslint exited ${String(result.status)}: ${result.stderr.trim()}`,
    )
  }
  return parseEslintReport(result.stdout, root, disabled, run.family)
}
