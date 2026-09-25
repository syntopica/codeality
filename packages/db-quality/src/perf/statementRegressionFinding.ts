import type { PerfConfig } from '@/config/PerfConfig.js'
import type { Finding } from '@/model/Finding.js'
import { isRegression } from '@/perf/isRegression.js'
import { perfFinding } from '@/perf/perfFinding.js'
import { statementContext } from '@/perf/statementContext.js'
import { statementSubject } from '@/perf/statementSubject.js'
import type { StatementWindow } from '@/perf/StatementWindow.js'

// BDB901: the mean crossed from a real previous reading into a materially
// slower one. `isRegression` narrows out `previousMeanMs === null` at
// runtime, but not for the type checker, so the guard is repeated here.
export const statementRegressionFinding = (
  window: StatementWindow,
  perf: PerfConfig,
): Finding | null => {
  if (!isRegression(window, perf) || window.previousMeanMs === null) return null
  const percent = Math.round((window.meanMs / window.previousMeanMs - 1) * 100)
  const sign = percent >= 0 ? '+' : ''
  return perfFinding(
    'BDB901',
    statementSubject(window),
    statementContext(window),
    `mean ${window.previousMeanMs.toFixed(2)} ms -> ${window.meanMs.toFixed(2)} ms (${sign}${String(percent)}%) over ${window.calls.toLocaleString('en-US')} calls`,
  )
}
