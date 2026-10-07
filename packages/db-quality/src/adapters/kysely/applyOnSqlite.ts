import { inlinedSqliteStatement } from '@/adapters/kysely/inlinedSqliteStatement.js'
import { KYSELY_SQLITE_FILENAME } from '@/adapters/kysely/KYSELY_SQLITE_FILENAME.js'
import { kyselyFinding } from '@/adapters/kysely/kyselyFinding.js'
import type { LocatedMigration } from '@/adapters/kysely/LocatedMigration.js'
import { sqliteFailureReason } from '@/adapters/kysely/sqliteFailureReason.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

// One transaction per migration, as Kysely's migrator runs it on SQLite: a
// statement SQLite refuses leaves the database as it was before the
// migration, and the next one is still applied.
/** BDB320/migration-fails-on-sqlite when sqlite3 refuses the migration's compiled up. */
export const applyOnSqlite = (
  runner: CommandRunner,
  directory: string,
  migration: LocatedMigration,
  disabled: DisableEntry[],
): Finding[] => {
  const compilation = migration.dialects.sqlite
  if (!compilation || compilation.error !== undefined) return []
  if (compilation.up.length === 0) return []
  const args = [
    '-bail',
    KYSELY_SQLITE_FILENAME,
    ...['begin', ...compilation.up.map(inlinedSqliteStatement), 'commit'].map(
      (statement) => `${statement};`,
    ),
  ]
  const result = runner('sqlite3', args, { cwd: directory })
  if (result.missing)
    throw new ToolMissingError(
      'sqlite3',
      'install the sqlite3 command line shell',
    )
  if (result.status === 0) return []
  const reason = sqliteFailureReason(result.stderr, args)
  return kyselyFinding(
    {
      rule: 'migration-fails-on-sqlite',
      severity: 'error',
      migration,
      message: `migration fails on SQLite: ${reason}`,
      context: `sqlite|${reason}`,
    },
    disabled,
  )
}
