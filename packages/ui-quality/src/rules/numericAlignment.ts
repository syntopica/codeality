import type { RawFinding } from '@/model/RawFinding.js'
import { childrenIndex } from '@/rules/childrenIndex.js'
import { numericColumnFault } from '@/rules/numericColumnFault.js'
import { rowTablesOf } from '@/rules/rowTablesOf.js'
import type { Rule } from '@/rules/Rule.js'
import { textBoxOf } from '@/rules/textBoxOf.js'

// A column of amounts, counts, dates or times in repeated rows is compared
// digit by digit: it needs its values on the trailing edge and digits of one
// width (`tabular-nums`, or a font whose figures are tabular already).
export const numericAlignment: Rule = (snapshot, context) => {
  const { tolerance, minRows } = context.options.rowMisaligned
  const children = childrenIndex(snapshot.elements)
  const findings: RawFinding[] = []
  for (const { parent, cells } of rowTablesOf(
    snapshot.elements,
    children,
    minRows,
  )) {
    const width = Math.min(...cells.map((row) => row.length))
    for (let column = 0; column < width; column++) {
      const boxes = cells
        .map((row) => row[column])
        .map((cell) => (cell ? textBoxOf(cell, children) : null))
        .filter((box) => box !== null)
      const fault = numericColumnFault(boxes, minRows, tolerance)
      const first = boxes[0]
      if (!fault || !first) continue
      findings.push({
        rule: 'numeric-alignment',
        severity: 'warn',
        message: `column ${String(column + 1)} holds numbers, but ${fault}; right-align it and set font-variant-numeric: tabular-nums`,
        subject: first.selector,
        identity: `${parent?.selector ?? ''}|${String(column)}`,
      })
    }
  }
  return findings
}
