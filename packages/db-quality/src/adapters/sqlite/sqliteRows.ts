import { sqliteQuery } from '@/adapters/sqlite/sqliteQuery.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

/** The rows of one read-only query, as `sqlite3 -json` prints them; none when it prints nothing. */
export const sqliteRows = <T>(
  runner: CommandRunner,
  root: string,
  file: string,
  sql: string,
): T[] => {
  const out = sqliteQuery(runner, root, file, sql).trim()
  return out ? (JSON.parse(out) as T[]) : []
}
