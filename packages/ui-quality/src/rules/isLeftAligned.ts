import type { ElementBox } from '@/model/ElementBox.js'
import { LEFT_TEXT_ALIGNS } from '@/rules/LEFT_TEXT_ALIGNS.js'
import { spreadOf } from '@/rules/spreadOf.js'

/**
 * Whether a column of values hangs from its left edge. Boxes that shrink to
 * their text show it as a shared left edge and ragged right ones; cells that
 * fill the column show it in `text-align`, which only matters when the values
 * differ in length.
 */
export const isLeftAligned = (
  boxes: ElementBox[],
  tolerance: number,
): boolean => {
  if (spreadOf(boxes.map((box) => box.x)) > tolerance) return false
  if (spreadOf(boxes.map((box) => box.x + box.width)) > tolerance) return true
  return (
    boxes.every((box) => LEFT_TEXT_ALIGNS.has(box.textAlign)) &&
    new Set(boxes.map((box) => box.textLength)).size > 1
  )
}
