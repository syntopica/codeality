import type { ElementBox } from '@/model/ElementBox.js'
import { previousSiblingOf } from '@/rules/previousSiblingOf.js'

/**
 * What sits just above `row`: its previous sibling, or, when it comes first,
 * that of its parent, climbing out of a `tfoot` or a wrapper up to three
 * levels. Null when nothing does.
 */
export const blockAbove = (
  row: ElementBox,
  elements: ElementBox[],
  children: Map<number, ElementBox[]>,
): ElementBox | null => {
  let current: ElementBox | undefined = row
  for (let level = 0; level < 3 && current; level++) {
    const previous = previousSiblingOf(current, children)
    if (previous) return previous
    current = current.parent === null ? undefined : elements[current.parent]
  }
  return null
}
