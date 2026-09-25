import { dollarTag } from '@/postgres/dollarTag.js'
import { PLAN_SETTING } from '@/postgres/PLAN_SETTING.js'

/**
 * EXPLAIN ANALYZE of `sql` run through a PL/pgSQL cursor inside a DO block.
 * The server, not a lexer here, keeps it to one statement: a cursor over a
 * multi-statement string is refused ("cannot open multi-query plan as
 * cursor"), so nothing after the EXPLAIN ever runs. The plan comes back
 * through a session setting, read by the next statement.
 */
export const explainDoBlock = (sql: string): string => {
  const quote = dollarTag(sql)
  const body = dollarTag(`${sql}$${quote}$`)
  return `do $${body}$ declare c refcursor; p text; begin open c for execute 'explain (analyze, buffers, format json) ' || $${quote}$${sql}$${quote}$; fetch c into p; close c; perform set_config('${PLAN_SETTING}', p, false); end $${body}$`
}
