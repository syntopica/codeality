/** What the capturing connection answers for a compiled query's SQL. */
export type QueryAnswer = (sql: string) => Record<string, unknown>[]
