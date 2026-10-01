import type { ElementBox } from '@/model/ElementBox.js'
import { ELLIPSIS_TAILS } from '@/rules/ELLIPSIS_TAILS.js'
import { SENTENCE_TAILS } from '@/rules/SENTENCE_TAILS.js'
import { spikeLength } from '@/rules/spikeLength.js'
import { tiesAtLongest } from '@/rules/tiesAtLongest.js'

/**
 * The cells of one column that were cut to a fixed length upstream, ending
 * without an ellipsis. The limit is either the longest length when at least
 * three distinct texts (or half the column) tie there, more on a long column
 * (natural text rarely ties at the maximum), or a length that spikes above its
 * neighbours. Texts ending a sentence, one label repeated on every row, and
 * a tie no larger than the texts just shorter than it are not cuts.
 */
export const hardCutColumn = (
  cells: ElementBox[],
  minLength: number,
): { length: number; cut: ElementBox[] } | null => {
  const texts = cells.filter((cell) => cell.textLength > 0)
  if (texts.length < 2) return null
  const longest = Math.max(...texts.map((cell) => cell.textLength))
  const length = tiesAtLongest(texts, longest, minLength)
    ? longest
    : spikeLength(texts, minLength)
  if (length === null) return null
  const cut = texts.filter(
    (cell) =>
      cell.textLength === length &&
      !ELLIPSIS_TAILS.some((tail) => cell.textTail.endsWith(tail)) &&
      !SENTENCE_TAILS.some((tail) => cell.textTail.endsWith(tail)),
  )
  // The same label on every row (a checkbox repeated per block) is the
  // copy, however long it is next to its neighbours.
  const repeated =
    cut.length > 1 && new Set(cut.map((cell) => cell.text)).size === 1
  return cut.length > 0 && !repeated ? { length, cut } : null
}
