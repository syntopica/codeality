import type { PerfConfig } from '@/config/PerfConfig.js'
import { PACKAGE_VERSION } from '@/packageVersion.js'
import type { PerfSnapshot } from '@/perf/PerfSnapshot.js'
import { readStatementStats } from '@/perf/readStatementStats.js'
import { readStatsReset } from '@/perf/readStatsReset.js'
import { readTableStats } from '@/perf/readTableStats.js'
import type { PsqlSession } from '@/postgres/PsqlSessionType.js'

export const takePerfSnapshot = (
  session: PsqlSession,
  perf: PerfConfig,
  host: string,
  takenAt: string,
): PerfSnapshot => {
  const statements = readStatementStats(session, perf)
  const tables = readTableStats(session)
  const statsReset = readStatsReset(session)
  return {
    schemaVersion: 1,
    toolVersion: PACKAGE_VERSION,
    takenAt,
    host,
    statsReset,
    statements,
    tables,
  }
}
