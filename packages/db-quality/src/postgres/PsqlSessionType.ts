/** A read-only Postgres session opened through `psql`: rows for a query, and the EXPLAIN ANALYZE JSON plan of one bench statement. */
export type PsqlSession = {
  rows: (sql: string) => unknown[]
  explain: (sql: string) => string
}
