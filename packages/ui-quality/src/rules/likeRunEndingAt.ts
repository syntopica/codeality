import type { ElementBox } from '@/model/ElementBox.js'
import { previousSiblingOf } from '@/rules/previousSiblingOf.js'

/** `last` and the siblings right before it that share its signature. */
export const likeRunEndingAt = (
  last: ElementBox,
  children: Map<number, ElementBox[]>,
): ElementBox[] => {
  const run = [last]
  let before = previousSiblingOf(last, children)
  while (before && before.signature === last.signature) {
    run.push(before)
    before = previousSiblingOf(before, children)
  }
  return run
}
