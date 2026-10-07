import { kyselyFinding } from '@/adapters/kysely/kyselyFinding.js'
import type { LocatedMigration } from '@/adapters/kysely/LocatedMigration.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'

// Under SQLite a throw while compiling is the same verdict as a statement
// SQLite refuses; on the other dialects it is its own rule, because nothing
// applies their SQL.
/** BDB320/migration-fails-on-sqlite or migration-does-not-compile: an up or down that threw. */
export const compileErrorFindings = (
  migrations: LocatedMigration[],
  disabled: DisableEntry[],
): Finding[] =>
  migrations.flatMap((migration) =>
    Object.entries(migration.dialects).flatMap(([dialect, compilation]) =>
      compilation.error === undefined
        ? []
        : kyselyFinding(
            {
              rule:
                dialect === 'sqlite'
                  ? 'migration-fails-on-sqlite'
                  : 'migration-does-not-compile',
              severity: 'error',
              migration,
              message: `migration throws while compiling for ${dialect}: ${compilation.error}`,
              context: `${dialect}|${compilation.error}`,
            },
            disabled,
          ),
    ),
  )
