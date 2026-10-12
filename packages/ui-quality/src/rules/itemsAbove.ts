import type { ElementBox } from '@/model/ElementBox.js'
import { amountTextOf } from '@/rules/amountTextOf.js'
import { blockAbove } from '@/rules/blockAbove.js'
import { likeRunEndingAt } from '@/rules/likeRunEndingAt.js'
import { LIST_TAGS } from '@/rules/LIST_TAGS.js'

/**
 * The items of the list just above a total row: the rows of the list element
 * before it, else the run of like siblings before it. Only items that show an
 * amount count.
 */
export const itemsAbove = (
  total: ElementBox,
  elements: ElementBox[],
  children: Map<number, ElementBox[]>,
): ElementBox[] => {
  const above = blockAbove(total, elements, children)
  if (!above) return []
  const kids = children.get(above.id) ?? []
  const isList =
    LIST_TAGS.has(above.tag) ||
    kids.some((kid) => (children.get(kid.id) ?? []).length > 0)
  return (isList ? kids : likeRunEndingAt(above, children)).filter(
    (item) => amountTextOf(item, elements) !== null,
  )
}
