import type { ElementBox } from '@/model/ElementBox.js'
import { isInlineLink } from '@/rules/isInlineLink.js'

/**
 * Something a thumb has to hit: an enabled control, link or ARIA widget the
 * probe marked tappable, on the page, and not a link inside a sentence. A
 * skip link parked off the left or top edge is not on the page.
 */
export const isTapTarget = (
  element: ElementBox,
  elements: ElementBox[],
): boolean =>
  element.tappable &&
  !element.disabled &&
  element.x + element.width > 0 &&
  element.y + element.height > 0 &&
  !isInlineLink(element, elements)
