import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { applyOnSqlite } from '@/adapters/kysely/applyOnSqlite.js'
import { KYSELY_SQLITE_FILENAME } from '@/adapters/kysely/KYSELY_SQLITE_FILENAME.js'
import type { LocatedMigration } from '@/adapters/kysely/LocatedMigration.js'
import { retargetedFinding } from '@/adapters/kysely/retargetedFinding.js'
import { runSqliteChecks } from '@/adapters/sqlite/runSqliteChecks.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

// Applied to a scratch file rather than `:memory:` because the table checks
// are separate sqlite3 runs that must see the same database; the file lives
// in a temporary directory and is removed afterwards.
/** Applies every migration's SQLite up in order, then runs the BDB401-BDB403 table checks on the result. */
export const kyselySqliteFindings = (
  runner: CommandRunner,
  migrations: LocatedMigration[],
  source: string,
  disabled: DisableEntry[],
): Finding[] => {
  const directory = mkdtempSync(join(tmpdir(), 'codeality-db-kysely-'))
  try {
    const failures = migrations.flatMap((migration) =>
      applyOnSqlite(runner, directory, migration, disabled),
    )
    // Nothing applied leaves no file, and sqlite3 -readonly cannot open one.
    const applied = existsSync(join(directory, KYSELY_SQLITE_FILENAME))
      ? [KYSELY_SQLITE_FILENAME]
      : []
    const tables = runSqliteChecks(runner, directory, applied, disabled).map(
      (finding) =>
        retargetedFinding(finding, {
          path: source,
          line: 0,
          subject: finding.subject,
          message: `on SQLite after every migration: ${finding.message}`,
        }),
    )
    return [...failures, ...tables]
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}
