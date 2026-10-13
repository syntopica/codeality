/**
 * The `path` a finding carries when it describes the live database rather than
 * a repository file (always with line 0): Postgres statistics and the
 * Supabase advisors. They are not files, so a diagnostic gives no location.
 */
export const DATABASE_LOCATIONS: ReadonlySet<string> = new Set([
  'postgres',
  'supabase',
])
