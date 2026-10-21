import type { ElementBox } from '@/model/ElementBox.js'
import { digitTemplate } from '@/rules/digitTemplate.js'
import { ELLIPSIS_TAILS } from '@/rules/ELLIPSIS_TAILS.js'
import type { HardCut } from '@/rules/HardCut.js'
import { HEX_IDENTIFIER } from '@/rules/HEX_IDENTIFIER.js'
import { MIN_DISTINCT_TIES } from '@/rules/MIN_DISTINCT_TIES.js'
import { SENTENCE_TAILS } from '@/rules/SENTENCE_TAILS.js'
import { spikeLength } from '@/rules/spikeLength.js'
import { tiesAtLongest } from '@/rules/tiesAtLongest.js'

/**
 * The cells of one column that were cut to a fixed length upstream, ending
 * without an ellipsis. The limit is either the longest length when at least
 * three distinct texts tie there, more on a long column
 * (natural text rarely ties at the maximum), or a length that spikes above its
 * neighbours. Texts ending a sentence, whole hexadecimal ids, one label repeated on every row, and
 * texts that differ only in digits, and a tie no larger than the texts just
 * shorter than it are not cuts.
 */
export const hardCutColumn = (
  cells: ElementBox[],
  minLength: number,
): HardCut | null => {
  const texts = cells.filter(
    (cell) => cell.textLength > 0 && /\s/.test(cell.text.trim()),
  )
  if (texts.length < MIN_DISTINCT_TIES) return null
  const longest = Math.max(...texts.map((cell) => cell.textLength))
  const length = tiesAtLongest(texts, longest, minLength)
    ? longest
    : spikeLength(texts, minLength)
  if (length === null) return null
  const cut = texts.filter(
    (cell) =>
      cell.textLength === length &&
      !ELLIPSIS_TAILS.some((tail) => cell.textTail.endsWith(tail)) &&
      !SENTENCE_TAILS.some((tail) => cell.textTail.endsWith(tail)) &&
      !HEX_IDENTIFIER.test(cell.text.trim()),
  )
  // The same label on every row (a checkbox repeated per block) is the
  // copy, however long it is next to its neighbours; so is one template whose
  // texts differ only in digits ("Probe 1788619860147", "updated Sep 22").
  const repeated =
    cut.length > 1 &&
    new Set(cut.map((cell) => digitTemplate(cell.text))).size === 1
  return cut.length >= MIN_DISTINCT_TIES && !repeated ? { length, cut } : null
}
