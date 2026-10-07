import type { ElementBox } from '@/model/ElementBox.js'
import type { Rgba } from '@/model/Rgba.js'
import { borderedSides } from '@/rules/borderedSides.js'
import { INSET_ROUNDING } from '@/rules/INSET_ROUNDING.js'
import { standsOut } from '@/rules/standsOut.js'
import { textExtentOf } from '@/rules/textExtentOf.js'
import { textInsetFloor } from '@/rules/textInsetFloor.js'

/**
 * The insets, in px, between a box's drawn left and right edges and its text
 * that are under the floor by more than the rounding of the measure; empty when the box draws no edge, holds no text or
 * has room. A fill that stands out draws both sides, a border only its own.
 */
export const crampedInsetsOf = (
  box: ElementBox,
  elements: ElementBox[],
  canvas: Rgba,
): number[] => {
  const filled = standsOut(box, elements, canvas)
  const drawn = borderedSides(box)
  const extent = textExtentOf(box, elements)
  if (!extent || (!filled && !drawn.includes(true))) return []
  const floor = textInsetFloor(box)
  const insets = [
    ...(filled || drawn[3]
      ? [extent.left - (box.x + box.borderWidths[3])]
      : []),
    ...(filled || drawn[1]
      ? [box.x + box.width - box.borderWidths[1] - extent.right]
      : []),
  ]
  return insets.filter((inset) => inset >= 0 && inset < floor - INSET_ROUNDING)
}
