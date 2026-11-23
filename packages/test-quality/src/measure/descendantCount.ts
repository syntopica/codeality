import { treeMembers } from '@/measure/treeMembers.js'
import type { ProcessRow } from '@/model/ProcessRow.js'

/** How many processes run under a process, not counting itself. */
export const descendantCount = (
  rows: ProcessRow[],
  rootPid: number,
): number => {
  const inTree = treeMembers(rows, rootPid)
  return rows.filter((row) => row.pid !== rootPid && inTree.has(row.pid)).length
}
