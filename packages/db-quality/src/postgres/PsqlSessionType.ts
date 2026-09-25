/** A read-only Postgres session opened through `psql`: rows for a query, raw text for one statement's own output (such as an EXPLAIN JSON). */
export type PsqlSession = {
  rows: (sql: string) => unknown[]
  text: (sql: string) => string
}
