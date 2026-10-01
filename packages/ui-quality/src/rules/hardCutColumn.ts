import type { ElementBox } from '@/model/ElementBox.js'
import { ELLIPSIS_TAILS } from '@/rules/ELLIPSIS_TAILS.js'

/**
 * The cells of one column that were cut to a fixed length upstream: at least
 * two share the longest length, which is long enough to be a limit, and they
 * end without an ellipsis. Natural text almost never ties at the maximum.
 */
export const hardCutColumn = (
  cells: ElementBox[],
  minLength: number,
): { length: number; cut: ElementBox[] } | null => {
  const texts = cells.filter((cell) => cell.textLength > 0)
  if (texts.length < 2) return null
  const longest = Math.max(...texts.map((cell) => cell.textLength))
  if (longest < minLength) return null
  const atLimit = texts.filter((cell) => cell.textLength === longest)
  if (atLimit.length < 2) return null
  const cut = atLimit.filter(
    (cell) => !ELLIPSIS_TAILS.some((tail) => cell.textTail.endsWith(tail)),
  )
  return cut.length > 0 ? { length: longest, cut } : null
}
