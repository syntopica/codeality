import type { ProcessRow } from '@/model/ProcessRow.js'

/** The pids of a process and all its descendants. */
export const treeMembers = (
  rows: ProcessRow[],
  rootPid: number,
): Set<number> => {
  const inTree = new Set([rootPid])
  let grew = true
  while (grew) {
    grew = false
    for (const row of rows) {
      if (!inTree.has(row.pid) && inTree.has(row.ppid)) {
        inTree.add(row.pid)
        grew = true
      }
    }
  }
  return inTree
}
