import { existsSync } from 'node:fs'

import { attemptSqlite } from '@/adapters/sqlite/attemptSqlite.js'
import type { QueryDatabaseProbe } from '@/adapters/sqlite/QueryDatabaseProbe.js'
import { resolveQueryDatabase } from '@/adapters/sqlite/resolveQueryDatabase.js'
import { userTables } from '@/adapters/sqlite/userTables.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

// The database is usually a local dev copy that CI does not have: its
// absence skips the plan check and says so, it never fails the run.
export const probeQueryDatabase = (
  runner: CommandRunner,
  root: string,
  database: string,
): QueryDatabaseProbe => {
  const path = resolveQueryDatabase(root, database)
  if (!existsSync(path)) return { path, unavailable: 'does not exist' }
  const tables = attemptSqlite(() => userTables(runner, root, path))
  return tables
    ? { path, tables }
    : { path, unavailable: 'is not a readable SQLite database' }
}
