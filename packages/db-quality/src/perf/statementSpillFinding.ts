import type { Finding } from '@/model/Finding.js'
import { perfFinding } from '@/perf/perfFinding.js'
import { statementContext } from '@/perf/statementContext.js'
import { statementSubject } from '@/perf/statementSubject.js'
import type { StatementWindow } from '@/perf/StatementWindow.js'

// BDB904: any temp blocks written mean a sort or hash spilled to disk during
// the window.
export const statementSpillFinding = (
  window: StatementWindow,
): Finding | null => {
  if (window.tempBlksWritten <= 0) return null
  return perfFinding(
    'BDB904',
    statementSubject(window),
    statementContext(window),
    `wrote ${window.tempBlksWritten.toLocaleString('en-US')} temp blocks over ${window.calls.toLocaleString('en-US')} calls: a sort or hash spilled to disk`,
  )
}
