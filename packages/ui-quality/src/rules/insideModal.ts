import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'

/** The element is, or sits in, a modal dialog. */
export const insideModal = (
  element: ElementBox,
  elements: ElementBox[],
): boolean =>
  [element, ...ancestorsOf(element, elements)].some(
    (box) => box.isModal === true,
  )
