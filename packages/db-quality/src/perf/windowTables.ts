import type { PerfSnapshot } from '@/perf/PerfSnapshot.js'
import type { TableWindow } from '@/perf/TableWindow.js'

// Same reset/new/fell rule as windowStatements, but liveRows is a live count
// rather than a cumulative counter, so it is always the current absolute
// value: only seqScan and idxScan are ever deltas.
export const windowTables = (
  previous: PerfSnapshot,
  current: PerfSnapshot,
): TableWindow[] => {
  const reset = current.statsReset !== previous.statsReset
  return current.tables.map((table): TableWindow => {
    const match = previous.tables.find(
      (candidate) => candidate.name === table.name,
    )
    const fell =
      match !== undefined &&
      (table.seqScan < match.seqScan || table.idxScan < match.idxScan)
    if (reset || match === undefined || fell) {
      return {
        name: table.name,
        liveRows: table.liveRows,
        seqScan: table.seqScan,
        idxScan: table.idxScan,
      }
    }
    return {
      name: table.name,
      liveRows: table.liveRows,
      seqScan: table.seqScan - match.seqScan,
      idxScan: table.idxScan - match.idxScan,
    }
  })
}
