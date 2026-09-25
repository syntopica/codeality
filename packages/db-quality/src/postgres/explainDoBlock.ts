import { dollarTag } from '@/postgres/dollarTag.js'
import { PLAN_SETTING } from '@/postgres/PLAN_SETTING.js'
import { ROLLBACK_SQLSTATE } from '@/postgres/ROLLBACK_SQLSTATE.js'

/**
 * EXPLAIN ANALYZE of `sql` run through a PL/pgSQL cursor inside a DO block.
 * The server, not a lexer here, keeps it to one statement: a cursor over a
 * multi-statement string is refused ("cannot open multi-query plan as
 * cursor"), so nothing after the EXPLAIN ever runs. It runs in an inner
 * block that always ends by raising ROLLBACK_SQLSTATE, so its subtransaction
 * is rolled back: EXPLAIN ANALYZE of CREATE TABLE AS, SELECT INTO or CREATE
 * MATERIALIZED VIEW writes even in a read-only transaction, and this undoes
 * it. The plan survives in a PL/pgSQL variable and comes back through a
 * session setting, read by the next statement.
 */
export const explainDoBlock = (sql: string): string => {
  const quote = dollarTag(sql)
  const body = dollarTag(`${sql}$${quote}$`)
  return `do $${body}$ declare c refcursor; p text; begin begin open c for execute 'explain (analyze, buffers, format json) ' || $${quote}$${sql}$${quote}$; fetch c into p; close c; raise exception using errcode = '${ROLLBACK_SQLSTATE}'; exception when sqlstate '${ROLLBACK_SQLSTATE}' then null; end; if p is null then raise exception 'the statement produced no plan'; end if; perform set_config('${PLAN_SETTING}', p, false); end $${body}$`
}
