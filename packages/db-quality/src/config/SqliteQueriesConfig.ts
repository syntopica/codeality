/** The `.sql` query files a SQLite project ships, and the database whose schema they run against. */
export type SqliteQueriesConfig = {
  paths: string[]
  database?: string
  minRows: number
}
