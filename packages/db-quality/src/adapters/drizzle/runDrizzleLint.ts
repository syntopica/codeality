import { parseEslintReport } from '@/adapters/drizzle/parseEslintReport.js'
import { assetPath } from '@/assetPath.js'
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'
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
export const runDrizzleLint = (
  runner: CommandRunner,
  root: string,
  drizzle: NonNullable<DbQualityConfig['drizzle']>,
  disabled: DisableEntry[],
): Finding[] => {
  const result = runner(
    'eslint',
    [
      '--no-config-lookup',
      '-c',
      assetPath('drizzle-eslint.config.mjs'),
      '-f',
      'json',
      '--pass-on-unpruned-suppressions',
      ...drizzle.roots,
    ],
    {
      cwd: root,
      env: { CODEALITY_DB_DRIZZLE_OBJECTS: drizzle.objectNames.join(',') },
    },
  )
  if (result.missing) {
    throw new ToolMissingError(
      'eslint',
      'add eslint, eslint-plugin-drizzle and typescript-eslint as devDependencies',
    )
  }
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(
      `eslint exited ${String(result.status)}: ${result.stderr.trim()}`,
    )
  }
  return parseEslintReport(result.stdout, root, disabled)
}
