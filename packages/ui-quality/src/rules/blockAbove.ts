import type { ElementBox } from '@/model/ElementBox.js'
import { descendantsOf } from '@/rules/descendantsOf.js'
import { previousSiblingOf } from '@/rules/previousSiblingOf.js'

/**
 * What sits just above `row`: its previous sibling, or, when it comes first,
 * that of its parent, climbing out of a `tfoot` or a wrapper up to three
 * levels. Null when nothing does, and when the wrapper climbed out of also
 * holds an action: that is an action bar's summary, not the foot of a list.
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
    const parent: ElementBox | undefined =
      current.parent === null ? undefined : elements[current.parent]
    if (parent && descendantsOf(parent, elements).some((box) => box.tappable))
      return null
    current = parent
  }
  return null
}
