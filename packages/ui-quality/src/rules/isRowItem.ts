import type { ElementBox } from '@/model/ElementBox.js'
import { descendantsOf } from '@/rules/descendantsOf.js'
import { PROSE_TEXT_LENGTH } from '@/rules/PROSE_TEXT_LENGTH.js'

/**
 * Whether an element reads as one entry of a data list: it has parts of its
 * own, none of them a paragraph of prose or a field to type into. A section
 * of a legal page and a field of a sign-in form both fail.
 */
export const isRowItem = (
  item: ElementBox,
  elements: ElementBox[],
): boolean => {
  const parts = descendantsOf(item, elements)
  return (
    parts.length > 0 &&
    [item, ...parts].every(
      (part) => !part.isTextEntry && part.textLength < PROSE_TEXT_LENGTH,
    )
  )
}
