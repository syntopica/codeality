import type { PerfConfig } from '@/config/PerfConfig.js'
import { REGRESSION_FLOOR_MS } from '@/perf/REGRESSION_FLOOR_MS.js'
import type { StatementWindow } from '@/perf/StatementWindow.js'

export const isRegression = (
  window: StatementWindow,
  perf: PerfConfig,
): boolean =>
  window.previousMeanMs !== null &&
  window.meanMs >= REGRESSION_FLOOR_MS &&
  window.meanMs >= window.previousMeanMs * (1 + perf.regressionPercent / 100) &&
  window.meanMs - window.previousMeanMs >= REGRESSION_FLOOR_MS
