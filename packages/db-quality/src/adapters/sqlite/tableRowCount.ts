import type { CountRow } from '@/adapters/sqlite/CountRow.js'
import { sqliteRows } from '@/adapters/sqlite/sqliteRows.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

export const tableRowCount = (
  runner: CommandRunner,
  root: string,
  database: string,
  table: string,
): number =>
  sqliteRows<CountRow>(
    runner,
    root,
    database,
    `select count(*) as n from "${table.replaceAll('"', '""')}"`,
  )[0]?.n ?? 0
