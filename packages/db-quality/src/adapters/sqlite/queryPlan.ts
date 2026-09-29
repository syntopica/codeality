import { planDetails } from '@/adapters/sqlite/planDetails.js'
import { sqliteQuery } from '@/adapters/sqlite/sqliteQuery.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

// Parameters stay unbound, so the shell binds NULL: the plan the application
// gets at prepare time. A literal would let SQLite fold `?1 IS NULL OR ...`
// away and show a plan the application never runs.
/** The plan details of one statement; throws when sqlite3 cannot plan it. */
export const queryPlan = (
  runner: CommandRunner,
  root: string,
  database: string,
  statement: string,
): string[] =>
  planDetails(
    sqliteQuery(runner, root, database, `EXPLAIN QUERY PLAN ${statement}`),
  )
