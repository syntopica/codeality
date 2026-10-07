import { kyselyFinding } from '@/adapters/kysely/kyselyFinding.js'
import type { LocatedMigration } from '@/adapters/kysely/LocatedMigration.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'

/** BDB320/migration-without-down: a migration that cannot be rolled back. */
export const withoutDownFindings = (
  migrations: LocatedMigration[],
  disabled: DisableEntry[],
): Finding[] =>
  migrations
    .filter((migration) => !migration.hasDown)
    .flatMap((migration) =>
      kyselyFinding(
        {
          rule: 'migration-without-down',
          severity: 'warn',
          migration,
          message: 'migration has no down(): it cannot be rolled back',
          context: 'no down',
        },
        disabled,
      ),
    )
