/** The calls that send a Kysely query to the database. */
export const EXECUTE_METHODS = new Set([
  'execute',
  'executeTakeFirst',
  'executeTakeFirstOrThrow',
])
