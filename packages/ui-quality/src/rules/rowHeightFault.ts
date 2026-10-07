import { MAX_HEADER_ROW_DIFFERENCE } from '@/rules/MAX_HEADER_ROW_DIFFERENCE.js'
import { MAX_ROW_HEIGHT_SPREAD } from '@/rules/MAX_ROW_HEIGHT_SPREAD.js'
import { median } from '@/rules/median.js'
import { MIN_BODY_ROWS } from '@/rules/MIN_BODY_ROWS.js'
import type { TableRows } from '@/rules/TableRows.js'

/**
 * What is wrong with a table's row heights, or null: body rows that are not
 * one height (rows with a cell on two lines or more wrap by design and are
 * left out, so are rows with a different number of cells than most, such as
 * a detail row), or a header row more than 8px off the body rows.
 */
export const rowHeightFault = ({ header, body }: TableRows): string | null => {
  const cellCounts = body.map(({ cells }) => cells.length)
  const usual = median(cellCounts)
  const plain = body.filter(
    ({ cells }) =>
      cells.length === usual && cells.every((cell) => cell.lines < 2),
  )
  if (plain.length < MIN_BODY_ROWS) return null
  const heights = plain.map(({ row }) => row.height)
  const spread = Math.max(...heights) - Math.min(...heights)
  if (spread > MAX_ROW_HEIGHT_SPREAD)
    return `its body rows run from ${String(Math.min(...heights))}px to ${String(Math.max(...heights))}px tall`
  const head = header[0]
  if (!head) return null
  const difference = Math.abs(head.row.height - median(heights))
  return difference > MAX_HEADER_ROW_DIFFERENCE
    ? `its header row is ${String(head.row.height)}px tall against ${String(median(heights))}px for the body rows`
    : null
}
