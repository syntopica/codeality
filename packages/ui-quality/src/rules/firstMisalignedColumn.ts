import type { ElementBox } from '@/model/ElementBox.js'
import type { MisalignedColumn } from '@/rules/MisalignedColumn.js'

/**
 * The first column whose cells share neither a left edge nor a right edge,
 * with the spread of its left edges. A right-aligned column (amounts, or an
 * email pushed to the end of the row) starts wherever its text is long.
 * Columns are compared while every row has a cell of the same signature at
 * that position; only the first is reported, since every later column
 * inherits its offset.
 */
export const firstMisalignedColumn = (
  rows: ElementBox[][],
  tolerance: number,
): MisalignedColumn | null => {
  const width = Math.min(...rows.map((cells) => cells.length))
  for (let column = 0; column < width; column++) {
    const cells = rows
      .map((cells) => cells[column])
      .filter((cell) => cell !== undefined)
    const first = cells[0]
    if (!first || cells.some((cell) => cell.signature !== first.signature))
      return null
    const xs = cells.map((cell) => cell.x)
    const min = Math.min(...xs)
    const max = Math.max(...xs)
    const rights = cells.map((cell) => cell.x + cell.width)
    const rightAligned = Math.max(...rights) - Math.min(...rights) <= tolerance
    if (max - min > tolerance && !rightAligned)
      return { column, cell: first, min, max }
  }
  return null
}
