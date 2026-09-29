/** The query database's tables, or why it could not be read. */
export type QueryDatabaseProbe =
  | { path: string; tables: Map<string, string> }
  | { path: string; unavailable: string }
