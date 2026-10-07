import type { ElementBox } from '@/model/ElementBox.js'
import { isPainted } from '@/rules/isPainted.js'

/** Top, right, bottom and left: whether the box draws a border on that side. */
export const borderedSides = (
  box: ElementBox,
): [boolean, boolean, boolean, boolean] => {
  const side = (index: number): boolean =>
    (box.borderWidths[index] ?? 0) > 0 &&
    isPainted(box.borderColors[index] ?? null)
  return [side(0), side(1), side(2), side(3)]
}
