/** Statements Supabase, PostgREST and this tool run on their own; none of them is the application's. */
export const PLATFORM_NOISE: RegExp[] = [
  /^select pg_sleep\(/i,
  /pg_timezone_names/i,
  /pg_stat_statements/i,
  /^WITH -- Recursively get the base types of domains/,
  /^SELECT wal->>/,
  /^COPY /i,
  /^select coalesce\(json_agg\(t\)/i,
]
