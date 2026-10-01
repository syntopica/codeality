import type { ElementBox } from '@/model/ElementBox.js'
import { MIN_DISTINCT_TIES } from '@/rules/MIN_DISTINCT_TIES.js'
import { pilesAtLongest } from '@/rules/pilesAtLongest.js'
import { TIES_PER_TEXT } from '@/rules/TIES_PER_TEXT.js'

/**
 * Whether enough distinct texts tie at `longest` to read it as a limit: at
 * least three (or half the column), more on a long column, and more than sit
 * just below it.
 */
export const tiesAtLongest = (
  texts: ElementBox[],
  longest: number,
  minLength: number,
): boolean => {
  // Distinct texts only: one value repeated on every row (a client name, a
  // helper sentence) is the data, not a limit it was cut to.
  const distinct = new Set(
    texts
      .filter((cell) => cell.textLength === longest)
      .map((cell) => cell.text),
  ).size
  return (
    longest >= minLength &&
    pilesAtLongest(texts, longest) &&
    distinct >= Math.max(2, Math.ceil(texts.length / TIES_PER_TEXT)) &&
    (distinct >= MIN_DISTINCT_TIES || distinct * 2 >= texts.length)
  )
}
