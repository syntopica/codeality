import type { ElementBox } from '@/model/ElementBox.js'

/**
 * The width a box of plain text does not use: its box less its words. 0 for a
 * control, whose width is room to type in, and for a box with children, whose
 * words are not all it holds.
 */
export const textSlackOf = (
  element: ElementBox,
  elements: ElementBox[],
): number => {
  if (element.text === '' || element.isControl) return 0
  if (elements.some((other) => other.parent === element.id)) return 0
  return Math.max(0, element.width - (element.textRight - element.textLeft))
}
