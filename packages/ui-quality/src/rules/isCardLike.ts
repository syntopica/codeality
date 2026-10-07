import type { ElementBox } from '@/model/ElementBox.js'
import type { Rgba } from '@/model/Rgba.js'
import { isCardExempt } from '@/rules/isCardExempt.js'
import { MIN_CARD_PADDING } from '@/rules/MIN_CARD_PADDING.js'
import { standsOut } from '@/rules/standsOut.js'

/** A padded box that reads as a surface: rounded, shadowed or filled. Unlike a card it need not draw a full border. */
export const isCardLike = (
  box: ElementBox,
  elements: ElementBox[],
  canvas: Rgba,
): boolean =>
  !isCardExempt(box) &&
  box.padding.every((side) => side >= MIN_CARD_PADDING) &&
  (box.borderRadius > 0 ||
    box.shadowBlur > 0 ||
    standsOut(box, elements, canvas))
