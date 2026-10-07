export type StatementStat = {
  role: string
  queryId: string
  text: string
  calls: number
  totalMs: number
  rows: number
  sharedBlksRead: number
  tempBlksWritten: number
  /**
   * In a recorded snapshot only: the mean of the window that ended when it was
   * taken, against the snapshot it replaced. `perf diff` compares against it
   * instead of the cumulative mean since the stats reset, which carries every
   * slow week since then. Absent on a first snapshot, after a reset, and for a
   * statement with no calls in that window.
   */
  windowMeanMs?: number
}
