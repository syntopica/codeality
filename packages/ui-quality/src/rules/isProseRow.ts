import type { ElementBox } from '@/model/ElementBox.js'

/**
 * Cells that share their container with loose text sit in a sentence: a link
 * inside a paragraph-like list item starts wherever the words before it end,
 * which is prose, not a column.
 */
export const isProseRow = (
  cells: ElementBox[],
  elements: ElementBox[],
): boolean => {
  const container = cells[0]?.parent
  if (container === undefined || container === null) return false
  return (elements[container]?.textLength ?? 0) > 0
}
