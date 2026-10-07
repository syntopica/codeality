import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { USER_CONTENT_CLASS } from '@/rules/USER_CONTENT_CLASS.js'
import { USER_CONTENT_TAGS } from '@/rules/USER_CONTENT_TAGS.js'

/** Inside an article, a rich-text or markdown body, or an editable region. */
export const isUserContent = (
  element: ElementBox,
  elements: ElementBox[],
): boolean =>
  [element, ...ancestorsOf(element, elements)].some(
    (box) =>
      USER_CONTENT_TAGS.has(box.tag) ||
      box.isTextEntry ||
      USER_CONTENT_CLASS.test(box.signature),
  )
