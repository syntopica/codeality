import { runEslintAsset } from '@/adapters/eslint/runEslintAsset.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { KyselyConfig } from '@/config/KyselyConfig.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

/** BDB310/<rule>: the package's own Kysely rules, run like the Drizzle ones. */
export const runKyselyLint = (
  runner: CommandRunner,
  root: string,
  kysely: KyselyConfig,
  disabled: DisableEntry[],
): Finding[] =>
  runEslintAsset(
    runner,
    root,
    {
      asset: 'kysely-eslint.config.mjs',
      roots: kysely.roots,
      env: { CODEALITY_DB_KYSELY_OBJECTS: kysely.objectNames.join(',') },
      family: { plugin: 'kysely', code: 'BDB310' },
      installHint: 'add eslint and typescript-eslint as devDependencies',
    },
    disabled,
  )
