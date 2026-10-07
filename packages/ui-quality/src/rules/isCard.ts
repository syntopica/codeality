import type { ElementBox } from '@/model/ElementBox.js'
import type { Rgba } from '@/model/Rgba.js'
import { hasFullBorder } from '@/rules/hasFullBorder.js'
import { isCardExempt } from '@/rules/isCardExempt.js'
import { MIN_CARD_PADDING } from '@/rules/MIN_CARD_PADDING.js'
import { standsOut } from '@/rules/standsOut.js'

/**
 * A rounded box padded at least 8px on every side that draws a surface: a
 * full border, a shadow, or a fill distinct from what is behind it.
 */
export const isCard = (
  element: ElementBox,
  elements: ElementBox[],
  canvas: Rgba,
): boolean =>
  element.borderRadius > 0 &&
  element.padding.every((side) => side >= MIN_CARD_PADDING) &&
  !isCardExempt(element) &&
  (hasFullBorder(element) ||
    element.shadowBlur > 0 ||
    standsOut(element, elements, canvas))
