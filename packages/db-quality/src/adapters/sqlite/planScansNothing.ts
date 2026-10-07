import { attemptSqlite } from '@/adapters/sqlite/attemptSqlite.js'
import { queryPlan } from '@/adapters/sqlite/queryPlan.js'
import type { QueryPlanContext } from '@/adapters/sqlite/QueryPlanContext.js'
import { scannedTables } from '@/adapters/sqlite/scannedTables.js'
import type { SqlStatement } from '@/sql/SqlStatement.js'

/** Whether sqlite3 plans the statement without reading any real table end to end; false when it cannot plan it. */
export const planScansNothing = (
  context: QueryPlanContext,
  statement: SqlStatement,
): boolean => {
  const details = attemptSqlite(() =>
    queryPlan(context.runner, context.root, context.database, statement.text),
  )
  return (
    details !== undefined &&
    scannedTables(statement.text, details, context.tables).length === 0
  )
}
