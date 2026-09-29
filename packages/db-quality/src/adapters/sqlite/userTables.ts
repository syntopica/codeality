import { sqliteRows } from '@/adapters/sqlite/sqliteRows.js'
import type { TableRow } from '@/adapters/sqlite/TableRow.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

/** Every table in sqlite_master, keyed by its lower-cased name. */
export const userTables = (
  runner: CommandRunner,
  root: string,
  database: string,
): Map<string, string> =>
  new Map(
    sqliteRows<TableRow>(
      runner,
      root,
      database,
      "select name from sqlite_master where type = 'table'",
    ).map((row) => [row.name.toLowerCase(), row.name]),
  )
