import type { ElementBox } from '@/model/ElementBox.js'
import { isProseRow } from '@/rules/isProseRow.js'
import { rowCells } from '@/rules/rowCells.js'
import { rowGroups } from '@/rules/rowGroups.js'
import type { RowTable } from '@/rules/RowTable.js'
import { wrapsChildren } from '@/rules/wrapsChildren.js'

/**
 * Every group of at least `minRows` repeated rows on the page, with their
 * cells. Wrapping containers lay out chips, and rows whose container holds
 * loose text are sentences: neither is a table.
 */
export const rowTablesOf = (
  elements: ElementBox[],
  children: Map<number, ElementBox[]>,
  minRows: number,
): RowTable[] => {
  const tables: RowTable[] = []
  for (const [parentId, siblings] of children) {
    const parent = elements[parentId]
    if (wrapsChildren(parent)) continue
    for (const rows of rowGroups(siblings, minRows)) {
      const cells = rows.map((row) => rowCells(row, children))
      if (cells.some((row) => isProseRow(row, elements))) continue
      tables.push({ parent, cells })
    }
  }
  return tables
}
