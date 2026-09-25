import type { PerfConfig } from '@/config/PerfConfig.js'
import { isPlatformNoise } from '@/perf/isPlatformNoise.js'
import type { StatementStat } from '@/perf/StatementStat.js'
import { statementStatsSql } from '@/perf/statementStatsSql.js'
import type { PsqlSession } from '@/postgres/PsqlSessionType.js'

export const readStatementStats = (
  session: PsqlSession,
  perf: PerfConfig,
): StatementStat[] => {
  const rows = session.rows(statementStatsSql(perf.roles)) as Record<
    string,
    unknown
  >[]
  return rows
    .map((row) => ({
      role: String(row['role']),
      queryId: String(row['query_id']),
      text: String(row['text']),
      calls: Number(row['calls']),
      totalMs: Number(row['total_ms']),
      rows: Number(row['rows']),
      sharedBlksRead: Number(row['shared_blks_read']),
      tempBlksWritten: Number(row['temp_blks_written']),
    }))
    .filter((statement) => !isPlatformNoise(statement.text, perf.ignore))
    .sort(
      (a, b) =>
        perf.roles.indexOf(a.role) - perf.roles.indexOf(b.role) ||
        a.queryId.localeCompare(b.queryId),
    )
}
