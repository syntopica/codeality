import type { PerfConfig } from '@/config/PerfConfig.js'
import type { Improvement } from '@/perf/Improvement.js'
import { statementSubject } from '@/perf/statementSubject.js'
import type { StatementWindow } from '@/perf/StatementWindow.js'

export const improvementsIn = (
  windows: StatementWindow[],
  perf: PerfConfig,
): Improvement[] =>
  windows.reduce<Improvement[]>((improvements, window) => {
    if (
      window.previousMeanMs === null ||
      window.calls < perf.minCalls ||
      window.meanMs > window.previousMeanMs * (1 - perf.regressionPercent / 100)
    )
      return improvements
    return [
      ...improvements,
      {
        subject: statementSubject(window),
        previousMs: window.previousMeanMs,
        currentMs: window.meanMs,
        calls: window.calls,
        savedMs: (window.previousMeanMs - window.meanMs) * window.calls,
      },
    ]
  }, [])
