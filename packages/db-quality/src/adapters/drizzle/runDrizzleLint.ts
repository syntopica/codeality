import { runEslintAsset } from '@/adapters/eslint/runEslintAsset.js'
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

export const runDrizzleLint = (
  runner: CommandRunner,
  root: string,
  drizzle: NonNullable<DbQualityConfig['drizzle']>,
  disabled: DisableEntry[],
): Finding[] =>
  runEslintAsset(
    runner,
    root,
    {
      asset: 'drizzle-eslint.config.mjs',
      roots: drizzle.roots,
      env: { CODEALITY_DB_DRIZZLE_OBJECTS: drizzle.objectNames.join(',') },
      family: { plugin: 'drizzle', code: 'BDB300' },
      installHint:
        'add eslint, eslint-plugin-drizzle and typescript-eslint as devDependencies',
    },
    disabled,
  )
