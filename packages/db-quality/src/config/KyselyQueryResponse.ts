/**
 * Rows the capturing driver answers when a compiled query's SQL contains
 * `match`, optionally only inside one migration or one of its steps.
 */
export type KyselyQueryResponse = {
  match: string
  rows: Record<string, unknown>[]
  migration?: string
  step?: 'up' | 'down'
}
