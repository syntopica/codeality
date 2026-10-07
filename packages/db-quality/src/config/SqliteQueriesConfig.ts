/** The `.sql` query files a SQLite project ships, and the database whose schema they run against. */
export type SqliteQueriesConfig = {
  paths: string[]
  /**
   * Root-relative globs of query files to leave out, such as one-shot data
   * migrations that scan on purpose (`sql/store/migrations/**`).
   */
  exclude: string[]
  database?: string
  minRows: number
}
