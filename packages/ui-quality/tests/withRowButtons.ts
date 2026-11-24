import type { ElementBox } from '@/model/ElementBox.js'
import { elementBox } from '@tests/elementBox.js'

/** Puts a button in the last cell of every body row of a `tableOf` table; the label is per row index. */
export const withRowButtons = (
  boxes: ElementBox[],
  label: (index: number) => string,
): ElementBox[] => {
  const cells = boxes.filter((box) => box.tag === 'td')
  const lastCells = cells.filter((_, index) => index % 3 === 2)
  const added = lastCells.map((cell, index) =>
    elementBox({
      id: boxes.length + index,
      parent: cell.id,
      tag: 'button',
      text: label(index),
      textLength: label(index).length,
      tappable: true,
    }),
  )
  return [...boxes, ...added]
}
