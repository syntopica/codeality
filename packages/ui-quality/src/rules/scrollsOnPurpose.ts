import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { CODE_TAGS } from '@/rules/CODE_TAGS.js'
import { WIDE_CONTENT_ROLES } from '@/rules/WIDE_CONTENT_ROLES.js'

/** Code, a table, a tab strip or a toolbar between the text and its frame: content that scrolls sideways by design. */
export const scrollsOnPurpose = (
  element: ElementBox,
  frame: ElementBox,
  elements: ElementBox[],
): boolean => {
  const chain = [element, ...ancestorsOf(element, elements)]
  return chain
    .slice(0, chain.indexOf(frame) + 1)
    .some(
      (box) =>
        CODE_TAGS.has(box.tag) ||
        box.tag === 'table' ||
        WIDE_CONTENT_ROLES.has(box.role),
    )
}
