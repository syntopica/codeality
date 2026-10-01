import type { ElementBox } from '@/model/ElementBox.js'

/**
 * The first column whose cells do not share a left edge, with its spread.
 * Columns are compared while every row has a cell of the same signature at
 * that position; only the first is reported, since every later column
 * inherits its offset.
 */
export const firstMisalignedColumn = (
  rows: ElementBox[][],
  tolerance: number,
): { column: number; cell: ElementBox; min: number; max: number } | null => {
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
    if (max - min > tolerance) return { column, cell: first, min, max }
  }
  return null
}
