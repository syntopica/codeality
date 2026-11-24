import type { ElementBox } from '@/model/ElementBox.js'
import { textBoxOf } from '@/rules/textBoxOf.js'

/** The text every row shows in one column, or undefined when a row differs, is empty or has no such cell. */
export const sharedColumnText = (
  cells: ElementBox[][],
  column: number,
  children: Map<number, ElementBox[]>,
): ElementBox | undefined => {
  const boxes = cells.map((row) => {
    const cell = row[column]
    return cell ? textBoxOf(cell, children) : null
  })
  const first = boxes[0]
  if (!first || first.text === '') return undefined
  return boxes.every((box) => box?.text === first.text) ? first : undefined
}
