import { sqliteFinding } from '@/adapters/sqlite/sqliteFinding.js'
import { sqliteRows } from '@/adapters/sqlite/sqliteRows.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

/** BDB402: one finding per row `PRAGMA foreign_key_check` reports. */
export const foreignKeyFindings = (
  runner: CommandRunner,
  root: string,
  file: string,
  disabled: DisableEntry[],
): Finding[] =>
  sqliteRows<{ table: string; rowid: number; parent: string }>(
    runner,
    root,
    file,
    'PRAGMA foreign_key_check',
  ).flatMap((row) =>
    sqliteFinding(
      {
        code: 'BDB402',
        severity: 'error',
        file,
        subject: row.table,
        message: `row ${String(row.rowid)} references missing ${row.parent}`,
        context: `${row.table}:${String(row.rowid)}:${row.parent}`,
      },
      disabled,
    ),
  )
