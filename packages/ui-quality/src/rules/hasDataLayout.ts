import { MIN_COLLECTION_ITEMS } from '@/capture/MIN_COLLECTION_ITEMS.js'
import type { ElementBox } from '@/model/ElementBox.js'
import { descendantsOf } from '@/rules/descendantsOf.js'
import { isRowItem } from '@/rules/isRowItem.js'

/**
 * Whether a region lays out data: a table, or one parent holding at least
 * `MIN_COLLECTION_ITEMS` row items of one tag (the rows of a list, the cards of
 * a grid). Prose and a single form have neither.
 */
export const hasDataLayout = (
  region: ElementBox,
  elements: ElementBox[],
): boolean => {
  const inside = descendantsOf(region, elements)
  if (inside.some((element) => element.tag === 'table')) return true
  const groups = new Map<string, ElementBox[]>()
  for (const element of inside) {
    const key = `${String(element.parent)} ${element.tag}`
    groups.set(key, [...(groups.get(key) ?? []), element])
  }
  return [...groups.values()].some(
    (group) =>
      group.length >= MIN_COLLECTION_ITEMS &&
      group.filter((item) => isRowItem(item, elements)).length >=
        MIN_COLLECTION_ITEMS,
  )
}
