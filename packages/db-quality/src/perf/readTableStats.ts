import { TABLE_STATS_SQL } from '@/perf/TABLE_STATS_SQL.js'
import type { TableStat } from '@/perf/TableStat.js'
import type { PsqlSession } from '@/postgres/PsqlSessionType.js'

export const readTableStats = (session: PsqlSession): TableStat[] => {
  const rows = session.rows(TABLE_STATS_SQL) as Record<string, unknown>[]
  return rows
    .map((row) => ({
      name: String(row['name']),
      liveRows: Number(row['live_rows']),
      seqScan: Number(row['seq_scan']),
      idxScan: Number(row['idx_scan']),
      bytes: Number(row['bytes']),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
