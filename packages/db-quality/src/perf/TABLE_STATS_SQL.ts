export const TABLE_STATS_SQL = `select schemaname || '.' || relname as name, n_live_tup::bigint as live_rows,
    seq_scan::bigint as seq_scan, coalesce(idx_scan, 0)::bigint as idx_scan, pg_total_relation_size(relid)::bigint as bytes
  from pg_stat_user_tables where schemaname = 'public'`
