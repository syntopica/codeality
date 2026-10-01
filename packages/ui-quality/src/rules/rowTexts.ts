import type { ElementBox } from '@/model/ElementBox.js'
import { descendantsOf } from '@/rules/descendantsOf.js'

/**
 * Every text-bearing element of a row in document order, however deeply the
 * row nests it: the n-th text of each row is one column of data.
 */
export const rowTexts = (
  row: ElementBox,
  elements: ElementBox[],
): ElementBox[] =>
  [row, ...descendantsOf(row, elements)].filter(
    (element) => element.text !== '',
  )
