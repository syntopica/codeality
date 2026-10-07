import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'

/** The main region itself or anything inside it. */
export const isInMain = (
  element: ElementBox,
  elements: ElementBox[],
): boolean =>
  element.isMain || ancestorsOf(element, elements).some((box) => box.isMain)
