import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'

/**
 * An open dialog or anything in it, or a fixed layer while one is open (its
 * backdrop): it covers the page on purpose.
 */
export const isModalLayer = (
  element: ElementBox,
  elements: ElementBox[],
): boolean =>
  [element, ...ancestorsOf(element, elements)].some((box) => box.isDialog) ||
  (element.position === 'fixed' && elements.some((box) => box.isDialog))
