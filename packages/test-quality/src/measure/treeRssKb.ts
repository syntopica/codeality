import type { ProcessRow } from '@/model/ProcessRow.js'

/** Resident memory of a process and all its descendants, in KB. */
export const treeRssKb = (rows: ProcessRow[], rootPid: number): number => {
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
  return rows
    .filter((row) => inTree.has(row.pid))
    .reduce((sum, row) => sum + row.rss, 0)
}
