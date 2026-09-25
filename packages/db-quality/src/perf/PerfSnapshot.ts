import type { StatementStat } from '@/perf/StatementStat.js'
import type { TableStat } from '@/perf/TableStat.js'

export type PerfSnapshot = {
  schemaVersion: 1
  toolVersion: string
  takenAt: string
  host: string
  statsReset: string | null
  statements: StatementStat[]
  tables: TableStat[]
}
