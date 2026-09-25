import type { PerfConfig } from '@/config/PerfConfig.js'
import type { StatementWindow } from '@/perf/StatementWindow.js'

export const isRegression = (
  window: StatementWindow,
  perf: PerfConfig,
): boolean =>
  window.previousMeanMs !== null &&
  window.meanMs >= 5 &&
  window.meanMs >= window.previousMeanMs * (1 + perf.regressionPercent / 100)
