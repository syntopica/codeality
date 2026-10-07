import { kyselySqliteFindings } from '@/adapters/kysely/kyselySqliteFindings.js'
import { kyselySquawkFindings } from '@/adapters/kysely/kyselySquawkFindings.js'
import { locatedMigrations } from '@/adapters/kysely/locatedMigrations.js'
import { readKyselyHashFile } from '@/adapters/kysely/readKyselyHashFile.js'
import { compileErrorFindings } from '@/adapters/kysely/rules/compileErrorFindings.js'
import { editedFindings } from '@/adapters/kysely/rules/editedFindings.js'
import { floatMoneyFindings } from '@/adapters/kysely/rules/floatMoneyFindings.js'
import { inlineReferencesFindings } from '@/adapters/kysely/rules/inlineReferencesFindings.js'
import { nativeEnumFindings } from '@/adapters/kysely/rules/nativeEnumFindings.js'
import { orderFindings } from '@/adapters/kysely/rules/orderFindings.js'
import { withoutDownFindings } from '@/adapters/kysely/rules/withoutDownFindings.js'
import { kyselySquawkExcludes } from '@/adapters/squawk/kyselySquawkExcludes.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { KyselyConfig } from '@/config/KyselyConfig.js'
import { kyselyDialectsOf } from '@/config/kyselyDialectsOf.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

/** Every finding on the compiled migrations: BDB320 rules, squawk on PostgreSQL, the SQLite application. */
export const runKyselyMigrationChecks = (
  runner: CommandRunner,
  root: string,
  kysely: KyselyConfig,
  disabled: DisableEntry[],
): Finding[] => {
  const config = kysely.migrations
  if (!config) return []
  const dialects = kyselyDialectsOf(root, config)
  const migrations = locatedMigrations(runner, root, config, dialects)
  const hashFile = readKyselyHashFile(root)
  const released = Object.keys(hashFile?.migrations ?? {})
  const source = config.module ?? config.folder ?? ''
  return [
    ...withoutDownFindings(migrations, disabled),
    ...orderFindings(migrations, released, disabled),
    ...nativeEnumFindings(migrations, dialects, disabled),
    ...(config.moneyColumns ? floatMoneyFindings(migrations, disabled) : []),
    ...inlineReferencesFindings(migrations, disabled),
    ...editedFindings(migrations, hashFile, disabled),
    ...compileErrorFindings(migrations, disabled),
    ...(dialects.includes('postgres')
      ? kyselySquawkFindings(runner, root, migrations, {
          excludes: kyselySquawkExcludes(dialects),
          disabled,
        })
      : []),
    ...(dialects.includes('sqlite')
      ? kyselySqliteFindings(runner, migrations, source, disabled)
      : []),
  ]
}
