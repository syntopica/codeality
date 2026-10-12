import type { ElementBox } from '@/model/ElementBox.js'
import { SCROLLABLE } from '@/rules/SCROLLABLE.js'
import { TABULAR_TAGS } from '@/rules/TABULAR_TAGS.js'

/**
 * The last of `rows` when it closes its list: nothing in the list comes after
 * it. Null for table rows, and for a list that scrolls, where a rule marks
 * the end of what scrolls.
 */
export const lastListItemOf = (
  list: ElementBox,
  rows: ElementBox[],
  children: Map<number, ElementBox[]>,
): ElementBox | null => {
  const last = rows.at(-1)
  if (!last || TABULAR_TAGS.has(last.tag) || SCROLLABLE.has(list.overflowY))
    return null
  return (children.get(list.id) ?? []).at(-1) === last ? last : null
}
