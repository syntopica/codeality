import type { ElementBox } from '@/model/ElementBox.js'
import { ELLIPSIS_TAILS } from '@/rules/ELLIPSIS_TAILS.js'
import { spikeLength } from '@/rules/spikeLength.js'

/**
 * The cells of one column that were cut to a fixed length upstream, ending
 * without an ellipsis. The limit is either the longest length when at least
 * two cells tie there (natural text almost never ties at the maximum) or a
 * length that spikes above its neighbours.
 */
export const hardCutColumn = (
  cells: ElementBox[],
  minLength: number,
): { length: number; cut: ElementBox[] } | null => {
  const texts = cells.filter((cell) => cell.textLength > 0)
  if (texts.length < 2) return null
  const longest = Math.max(...texts.map((cell) => cell.textLength))
  const tiesAtLongest =
    longest >= minLength &&
    texts.filter((cell) => cell.textLength === longest).length >= 2
  const length = tiesAtLongest ? longest : spikeLength(texts, minLength)
  if (length === null) return null
  const cut = texts.filter(
    (cell) =>
      cell.textLength === length &&
      !ELLIPSIS_TAILS.some((tail) => cell.textTail.endsWith(tail)),
  )
  return cut.length > 0 ? { length, cut } : null
}
