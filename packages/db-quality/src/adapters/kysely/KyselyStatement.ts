/** One compiled query as a capturing driver saw it, parameters made JSON-safe. */
export type KyselyStatement = { sql: string; parameters: unknown[] }
