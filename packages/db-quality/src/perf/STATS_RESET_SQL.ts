export const STATS_RESET_SQL =
  'select stats_reset::text as stats_reset from pg_stat_statements_info()'
