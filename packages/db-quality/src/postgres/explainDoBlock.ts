import { dollarTag } from '@/postgres/dollarTag.js'
import { PLAN_SETTING } from '@/postgres/PLAN_SETTING.js'

/**
 * EXPLAIN ANALYZE of `sql` run through PL/pgSQL EXECUTE inside a DO block.
 * The server, not a lexer here, keeps the statement in the read-only
 * transaction: EXECUTE refuses COMMIT and ROLLBACK, and a SET TRANSACTION
 * READ WRITE after the EXPLAIN has started is rejected. The plan comes back
 * through a session setting, read by the next statement.
 */
export const explainDoBlock = (sql: string): string => {
  const quote = dollarTag(sql)
  const body = dollarTag(`${sql}$${quote}$`)
  return `do $${body}$ declare p text; begin execute 'explain (analyze, buffers, format json) ' || $${quote}$${sql}$${quote}$ into p; perform set_config('${PLAN_SETTING}', p, false); end $${body}$`
}
