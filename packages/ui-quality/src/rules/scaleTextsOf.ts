import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { isInMain } from '@/rules/isInMain.js'
import { isUserContent } from '@/rules/isUserContent.js'
import { SMALL_TEXT_TAGS } from '@/rules/SMALL_TEXT_TAGS.js'

/**
 * The texts whose sizes make the product's type scale: those with text of
 * their own in the main region, less authored content and code, superscripts
 * and subscripts, which are sized by design.
 */
export const scaleTextsOf = (elements: ElementBox[]): ElementBox[] =>
  elements.filter(
    (element) =>
      element.text !== '' &&
      isInMain(element, elements) &&
      ![element, ...ancestorsOf(element, elements)].some((box) =>
        SMALL_TEXT_TAGS.has(box.tag),
      ) &&
      !isUserContent(element, elements),
  )
