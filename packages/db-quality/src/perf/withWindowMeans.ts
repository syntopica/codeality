import type { PerfSnapshot } from '@/perf/PerfSnapshot.js'
import { windowStatements } from '@/perf/windowStatements.js'

/** Records on each statement of `current` the mean of its window since `previous`, where the counters continued and it was called. */
export const withWindowMeans = (
  previous: PerfSnapshot,
  current: PerfSnapshot,
): PerfSnapshot => {
  const windows = windowStatements(previous, current)
  return {
    ...current,
    statements: current.statements.map((statement, index) => {
      const window = windows[index]
      if (!window || window.previousMeanMs === null || window.calls === 0)
        return statement
      return { ...statement, windowMeanMs: window.meanMs }
    }),
  }
}
