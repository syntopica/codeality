import type { ElementBox } from '@/model/ElementBox.js'
import { elementBox } from '@tests/elementBox.js'

/**
 * A list `ul#0` of `li > a` rows, each with cells at the given x positions and
 * texts. Ids are assigned in document order, as the probe does.
 */
export const rows = (table: { x: number; text: string }[][]): ElementBox[] => {
  const elements: ElementBox[] = [
    elementBox({ id: 0, tag: 'ul', signature: 'ul', selector: 'ul' }),
  ]
  table.forEach((cells, row) => {
    const li = elementBox({
      id: elements.length,
      parent: 0,
      tag: 'li',
      signature: 'li',
      y: row * 40,
    })
    elements.push(li)
    const link = elementBox({
      id: elements.length,
      parent: li.id,
      tag: 'a',
      signature: 'a.row',
      y: row * 40,
    })
    elements.push(link)
    cells.forEach((cell, column) => {
      elements.push(
        elementBox({
          id: elements.length,
          parent: link.id,
          tag: 'span',
          signature: `span.c${String(column)}`,
          selector: `ul > li > a > span.c${String(column)}`,
          x: cell.x,
          y: row * 40,
          text: cell.text.slice(0, 80),
          textLength: cell.text.length,
          textTail: cell.text.slice(-3),
        }),
      )
    })
  })
  return elements
}
