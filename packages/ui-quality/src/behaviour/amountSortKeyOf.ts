import { hasMultipleNumericLines } from '@/behaviour/hasMultipleNumericLines.js'
import { numberOf } from '@/behaviour/numberOf.js'

/** Parse one displayed amount while keeping separate numeric lines as text. */
export const amountSortKeyOf = (
  original: string,
  normalized: string,
): number | string =>
  hasMultipleNumericLines(original)
    ? normalized
    : (numberOf(normalized) ?? normalized)
