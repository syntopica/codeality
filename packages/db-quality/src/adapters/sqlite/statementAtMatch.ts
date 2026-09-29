import type { SqlStatement } from '@/sql/SqlStatement.js'

/** The statement re-anchored on the line where a match at `index` of its text sits. */
export const statementAtMatch = (
  statement: SqlStatement,
  index: number,
): SqlStatement => ({
  text: statement.text,
  line:
    statement.line + (statement.text.slice(0, index).match(/\n/g)?.length ?? 0),
})
