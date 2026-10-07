import { KYSELY_HASH_FILENAME } from '@/adapters/kysely/KYSELY_HASH_FILENAME.js'
import { kyselyFinding } from '@/adapters/kysely/kyselyFinding.js'
import type { KyselyHashFile } from '@/adapters/kysely/KyselyHashFile.js'
import type { LocatedMigration } from '@/adapters/kysely/LocatedMigration.js'
import { migrationHashes } from '@/adapters/kysely/migrationHashes.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'

/** BDB320/migration-edited: a released migration whose compiled SQL no longer matches its recorded hash. */
export const editedFindings = (
  migrations: LocatedMigration[],
  hashFile: KyselyHashFile | undefined,
  disabled: DisableEntry[],
): Finding[] =>
  migrations.flatMap((migration) => {
    const recorded = hashFile?.migrations[migration.name]
    if (recorded === undefined) return []
    const changed = Object.entries(migrationHashes(migration))
      .filter(([dialect, hash]) => {
        const before = recorded[dialect as keyof typeof recorded]
        return before !== undefined && before !== hash
      })
      .map(([dialect]) => dialect)
    return changed.length === 0
      ? []
      : kyselyFinding(
          {
            rule: 'migration-edited',
            severity: 'error',
            migration,
            message: `released migration was edited: what it runs on ${changed.join(', ')} no longer matches ${KYSELY_HASH_FILENAME}; add a new migration instead, or accept it with "baseline update --accept-edit ${migration.name}"`,
            context: changed.join(','),
          },
          disabled,
        )
  })
