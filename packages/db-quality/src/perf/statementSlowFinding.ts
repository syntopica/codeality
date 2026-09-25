import type { PerfConfig } from '@/config/PerfConfig.js'
import type { Finding } from '@/model/Finding.js'
import { perfFinding } from '@/perf/perfFinding.js'
import { statementContext } from '@/perf/statementContext.js'
import { statementSubject } from '@/perf/statementSubject.js'
import type { StatementWindow } from '@/perf/StatementWindow.js'

// BDB902: the statement is simply slow on its own terms, independent of
// whether it regressed against its previous reading.
export const statementSlowFinding = (
  window: StatementWindow,
  perf: PerfConfig,
): Finding | null => {
  if (window.meanMs < perf.slowMs) return null
  return perfFinding(
    'BDB902',
    statementSubject(window),
    statementContext(window),
    `mean ${window.meanMs.toFixed(2)} ms over ${window.calls.toLocaleString('en-US')} calls, threshold ${perf.slowMs.toLocaleString('en-US')} ms`,
  )
}
