import { kyselyFinding } from '@/adapters/kysely/kyselyFinding.js'
import type { LocatedMigration } from '@/adapters/kysely/LocatedMigration.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'

// Kysely's migrator orders by `localeCompare` and, by default, refuses to run
// a pending migration that sorts before one already executed.
/** BDB320/migration-order: a name that does not sort after the one before it, or before a released one. */
export const orderFindings = (
  migrations: LocatedMigration[],
  released: string[],
  disabled: DisableEntry[],
): Finding[] => {
  const latest = [...released].sort((a, b) => a.localeCompare(b)).at(-1)
  return migrations.flatMap((migration, index) => {
    const previous = migrations[index - 1]?.name
    const message =
      previous !== undefined && migration.name.localeCompare(previous) <= 0
        ? `"${migration.name}" does not sort after "${previous}": Kysely runs migrations in name order, not declaration order`
        : latest !== undefined &&
            !released.includes(migration.name) &&
            migration.name.localeCompare(latest) < 0
          ? `new migration "${migration.name}" sorts before the released "${latest}": Kysely's migrator refuses to run it on a database that already ran "${latest}"`
          : undefined
    return message === undefined
      ? []
      : kyselyFinding(
          {
            rule: 'migration-order',
            severity: 'error',
            migration,
            message,
            context: message,
          },
          disabled,
        )
  })
}
