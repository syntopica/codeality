// Kysely's migrator wraps each PostgreSQL migration in a transaction, so a
// CONCURRENTLY index cannot run there, and the schema builder has no portable
// way to set the two timeouts. `prefer-robust-stmts` stays on, unlike under
// Supabase: on MySQL the same migrations run outside any transaction, so a
// half-applied one is re-run and has to be idempotent.
export const KYSELY_SQUAWK_EXCLUDES = [
  'require-lock-timeout',
  'require-statement-timeout',
  'require-concurrent-index-creation',
]
