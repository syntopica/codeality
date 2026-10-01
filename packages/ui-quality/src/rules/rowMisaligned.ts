import type { RawFinding } from '@/model/RawFinding.js'
import { childrenIndex } from '@/rules/childrenIndex.js'
import { firstMisalignedColumn } from '@/rules/firstMisalignedColumn.js'
import { isProseRow } from '@/rules/isProseRow.js'
import { rowCells } from '@/rules/rowCells.js'
import { rowGroups } from '@/rules/rowGroups.js'
import type { Rule } from '@/rules/Rule.js'
import { wrapsChildren } from '@/rules/wrapsChildren.js'

// Repeated rows whose n-th cell starts at a different x: a column that
// follows the width of the content before it instead of a fixed track.
export const rowMisaligned: Rule = (snapshot, context) => {
  const { tolerance, minRows } = context.options.rowMisaligned
  const children = childrenIndex(snapshot.elements)
  const findings: RawFinding[] = []
  for (const [parentId, siblings] of children) {
    const parent = snapshot.elements[parentId]
    if (wrapsChildren(parent)) continue
    for (const rows of rowGroups(siblings, minRows)) {
      const cells = rows.map((row) => rowCells(row, children))
      if (cells.some((row) => isProseRow(row, snapshot.elements))) continue
      const misaligned = firstMisalignedColumn(cells, tolerance)
      if (!misaligned) continue
      findings.push({
        rule: 'row-misaligned',
        severity: 'error',
        message: `column ${String(misaligned.column + 1)} of ${String(rows.length)} rows starts anywhere from x=${String(misaligned.min)} to x=${String(misaligned.max)}; give the column before it a fixed width or use grid columns`,
        subject: misaligned.cell.selector,
        identity: `${parent?.selector ?? ''}|${String(misaligned.column)}`,
      })
    }
  }
  return findings
}
