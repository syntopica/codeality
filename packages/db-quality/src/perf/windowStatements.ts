import type { PerfSnapshot } from '@/perf/PerfSnapshot.js'
import type { StatementWindow } from '@/perf/StatementWindow.js'

// A reset loses the old mean too, since the old totals were measured against
// a different history; a new statement has nothing to regress from; a
// counter falling back means the server-side stat itself reset underneath
// us. All three cases fall back to the current absolute values.
export const windowStatements = (
  previous: PerfSnapshot,
  current: PerfSnapshot,
): StatementWindow[] => {
  const reset = current.statsReset !== previous.statsReset
  return current.statements.map((statement): StatementWindow => {
    const match = previous.statements.find(
      (candidate) =>
        candidate.role === statement.role &&
        candidate.queryId === statement.queryId,
    )
    const fell =
      match !== undefined &&
      (statement.calls < match.calls ||
        statement.totalMs < match.totalMs ||
        statement.tempBlksWritten < match.tempBlksWritten)
    if (reset || match === undefined || fell) {
      const { calls, totalMs, tempBlksWritten } = statement
      return {
        role: statement.role,
        queryId: statement.queryId,
        text: statement.text,
        calls,
        totalMs,
        tempBlksWritten,
        meanMs: calls === 0 ? 0 : totalMs / calls,
        previousMeanMs: null,
      }
    }
    const calls = statement.calls - match.calls
    const totalMs = statement.totalMs - match.totalMs
    return {
      role: statement.role,
      queryId: statement.queryId,
      text: statement.text,
      calls,
      totalMs,
      tempBlksWritten: statement.tempBlksWritten - match.tempBlksWritten,
      meanMs: calls === 0 ? 0 : totalMs / calls,
      previousMeanMs: match.calls === 0 ? null : match.totalMs / match.calls,
    }
  })
}
