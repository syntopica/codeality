/**
 * Top-level plannable DML of the application's roles; roles are validated
 * identifiers (ROLE_NAME_PATTERN), so quoting them is enough. pg_stat_statements
 * replaces constants only in plannable statements: utility text (CREATE ROLE
 * ... PASSWORD, SET, function bodies) is stored verbatim, so it never enters
 * the snapshot, and neither does the tool's own EXPLAIN.
 */
export const statementStatsSql = (roles: string[]): string =>
  `select r.rolname as role, s.queryid::text as query_id,
    left(regexp_replace(s.query, '\\s+', ' ', 'g'), 200) as text,
    s.calls::bigint as calls, s.total_exec_time as total_ms, s.rows::bigint as rows,
    s.shared_blks_read::bigint as shared_blks_read, s.temp_blks_written::bigint as temp_blks_written
  from pg_stat_statements s join pg_roles r on r.oid = s.userid
  where s.toplevel and r.rolname in (${roles.map((role) => `'${role}'`).join(', ')})
    and s.query ~* '^\\s*(select|with|insert|update|delete|merge|values|table)\\y'
    and s.query !~* '^\\s*explain'`
