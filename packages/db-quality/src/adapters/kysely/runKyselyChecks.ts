import { runKyselyLint } from '@/adapters/kysely/runKyselyLint.js'
import { runKyselyMigrationChecks } from '@/adapters/kysely/runKyselyMigrationChecks.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { KyselyConfig } from '@/config/KyselyConfig.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

/** The Kysely code lint, then the migration checks when `kysely.migrations` is set. */
export const runKyselyChecks = (
  runner: CommandRunner,
  root: string,
  kysely: KyselyConfig,
  disabled: DisableEntry[],
): Finding[] => [
  ...runKyselyLint(runner, root, kysely, disabled),
  ...runKyselyMigrationChecks(runner, root, kysely, disabled),
]
