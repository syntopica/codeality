import type { ElementBox } from '@/model/ElementBox.js'
import { descendantsOf } from '@/rules/descendantsOf.js'
import { isContentless } from '@/rules/isContentless.js'

/** The box or something inside it carries text, a control or media. */
export const holdsContent = (
  element: ElementBox,
  elements: ElementBox[],
): boolean =>
  !isContentless(element) ||
  descendantsOf(element, elements).some((box) => !isContentless(box))
