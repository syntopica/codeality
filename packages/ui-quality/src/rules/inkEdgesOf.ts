import type { ElementBox } from '@/model/ElementBox.js'
import { descendantsOf } from '@/rules/descendantsOf.js'
import type { InkEdges } from '@/rules/InkEdges.js'
import { isInk } from '@/rules/isInk.js'

/** Where the ink inside `root` starts and ends; null when it paints nothing. */
export const inkEdgesOf = (
  root: ElementBox,
  elements: ElementBox[],
): InkEdges | null => {
  const ink = descendantsOf(root, elements).filter(isInk)
  if (ink.length === 0) return null
  return {
    left: Math.min(...ink.map((element) => element.x)),
    right: Math.max(...ink.map((element) => element.x + element.width)),
  }
}
