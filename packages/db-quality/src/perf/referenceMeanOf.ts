import type { StatementStat } from '@/perf/StatementStat.js'

/** The mean a new window is judged against: the recorded window mean, else the cumulative mean since the reset. */
export const referenceMeanOf = (recorded: StatementStat): number | null =>
  recorded.windowMeanMs ??
  (recorded.calls === 0 ? null : recorded.totalMs / recorded.calls)
