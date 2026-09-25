import type { DisableEntry } from '@/config/DisableEntry.js'
import type { PerfConfig } from '@/config/PerfConfig.js'
import { compareFindings } from '@/model/compareFindings.js'
import { improvementsIn } from '@/perf/improvementsIn.js'
import { isRegression } from '@/perf/isRegression.js'
import type { PerfDiff } from '@/perf/PerfDiff.js'
import type { PerfSnapshot } from '@/perf/PerfSnapshot.js'
import { statementFindings } from '@/perf/statementFindings.js'
import { tableFindings } from '@/perf/tableFindings.js'
import { windowStatements } from '@/perf/windowStatements.js'
import { windowTables } from '@/perf/windowTables.js'

export const diffSnapshots = (
  previous: PerfSnapshot,
  current: PerfSnapshot,
  perf: PerfConfig,
  disabled: DisableEntry[],
): PerfDiff => {
  const statementWindows = windowStatements(previous, current)
  const eligible = statementWindows.filter(
    (window) => window.calls >= perf.minCalls,
  )
  const improvements = improvementsIn(statementWindows, perf)
  const findings = [
    ...statementFindings(statementWindows, perf, disabled),
    ...tableFindings(windowTables(previous, current), perf, disabled),
  ].sort(compareFindings)
  return {
    from: previous.takenAt,
    to: current.takenAt,
    improvements,
    findings,
    savedMs: improvements.reduce(
      (sum, improvement) => sum + improvement.savedMs,
      0,
    ),
    lostMs: eligible
      .filter((window) => isRegression(window, perf))
      .reduce(
        (sum, window) =>
          sum +
          (window.previousMeanMs === null
            ? 0
            : (window.meanMs - window.previousMeanMs) * window.calls),
        0,
      ),
  }
}
