import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { MIN_META_ITEMS } from '@/rules/MIN_META_ITEMS.js'
import { sharesRow } from '@/rules/sharesRow.js'

/**
 * The flex row, within three levels of `element`, that lays it out on one
 * line with at least MIN_META_ITEMS items; null when it has more room.
 */
export const crowdedRowOf = (
  element: ElementBox,
  elements: ElementBox[],
  children: Map<number, ElementBox[]>,
): ElementBox | null => {
  const chain = [element, ...ancestorsOf(element, elements).slice(0, 3)]
  for (let index = 0; index < chain.length - 1; index++) {
    const item = chain[index]
    const row = chain[index + 1]
    if (!item || !row || !row.display.includes('flex')) continue
    const line = (children.get(row.id) ?? []).filter((sibling) =>
      sharesRow(sibling, item),
    )
    if (line.length >= MIN_META_ITEMS) return row
  }
  return null
}
