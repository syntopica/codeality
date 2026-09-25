import { STATS_RESET_SQL } from '@/perf/STATS_RESET_SQL.js'
import type { PsqlSession } from '@/postgres/PsqlSessionType.js'

export const readStatsReset = (session: PsqlSession): string | null => {
  const rows = session.rows(STATS_RESET_SQL) as Record<string, unknown>[]
  const value = rows[0]?.['stats_reset']
  return typeof value === 'string' ? value : null
}
