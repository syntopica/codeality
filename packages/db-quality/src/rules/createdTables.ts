import { matchedTables } from '@/rules/matchedTables.js'
import type { StatementRef } from '@/rules/StatementRef.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'

/** Tables created in `public`, each mapped to the statement that creates it. */
export const createdTables = (
  set: MigrationFile[],
): Map<string, StatementRef> =>
  new Map(
    [
      ...matchedTables(
        set,
        /^create (?:unlogged |temp(?:orary)? )?table (?:if not exists )?((?:"[^"]+"|[\w$]+)(?:\.(?:"[^"]+"|[\w$]+))?)/,
      ),
    ].filter(([name]) => name.startsWith('public.')),
  )
