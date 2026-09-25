import { matchedTables } from '@/rules/matchedTables.js'
import type { StatementRef } from '@/rules/StatementRef.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'

/** Tables whose row level security a migration enables, mapped to that statement. */
export const rlsEnabledTables = (
  set: MigrationFile[],
): Map<string, StatementRef> =>
  matchedTables(
    set,
    /^alter table (?:if exists )?(?:only )?((?:"[^"]+"|[\w$]+)(?:\.(?:"[^"]+"|[\w$]+))?) enable row level security/,
  )
