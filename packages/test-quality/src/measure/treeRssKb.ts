import { treeMembers } from '@/measure/treeMembers.js'
import type { ProcessRow } from '@/model/ProcessRow.js'

/** Resident memory of a process and all its descendants, in KB. */
export const treeRssKb = (rows: ProcessRow[], rootPid: number): number => {
  const inTree = treeMembers(rows, rootPid)
  return rows
    .filter((row) => inTree.has(row.pid))
    .reduce((sum, row) => sum + row.rss, 0)
}
