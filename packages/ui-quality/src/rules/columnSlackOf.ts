import type { ElementBox } from '@/model/ElementBox.js'
import { textSlackOf } from '@/rules/textSlackOf.js'

/**
 * The width `cell` leaves unused in every row of its list: the least slack
 * among the cells at its position in the rows beside its own. A column is as
 * wide as its longest entry needs, so room one short entry leaves is not room
 * to give away.
 */
export const columnSlackOf = (
  cell: ElementBox,
  elements: ElementBox[],
): number => {
  const row = elements.find((element) => element.id === cell.parent)
  if (!row) return textSlackOf(cell, elements)
  const cellsOf = (parent: ElementBox): ElementBox[] =>
    elements.filter((element) => element.parent === parent.id)
  const index = cellsOf(row).indexOf(cell)
  const peers = elements
    .filter((other) => other.parent === row.parent && other.tag === row.tag)
    .map((other) => cellsOf(other)[index])
    .filter((peer): peer is ElementBox => peer !== undefined)
  return Math.min(...peers.map((peer) => textSlackOf(peer, elements)))
}
