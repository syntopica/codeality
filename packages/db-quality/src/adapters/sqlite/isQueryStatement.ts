import type { SqlStatement } from '@/sql/SqlStatement.js'

/** A statement the planner plans: DDL, pragmas and transaction control are not queries. */
export const isQueryStatement = (statement: SqlStatement): boolean =>
  /^(?:select|with|update|delete|insert|replace)\b/i.test(statement.text)
