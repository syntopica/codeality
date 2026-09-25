// Supabase applies each migration inside one transaction with the CLI's own
// timeouts, so the lock, timeout and CONCURRENTLY rules describe a deployment
// model these projects do not have. Measured 2026-09-25 over six repositories:
// these four were 80% of every squawk line and none of them was actionable.
export const SUPABASE_SQUAWK_EXCLUDES = [
  'prefer-robust-stmts',
  'require-lock-timeout',
  'require-statement-timeout',
  'require-concurrent-index-creation',
]
