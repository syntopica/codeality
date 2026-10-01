import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import type { InkEdges } from '@/rules/InkEdges.js'

/**
 * The horizontal extent of `element` that can actually be seen: its box cut to
 * every ancestor that clips or scrolls sideways. A wide table inside a
 * scrolling frame paints only as far as the frame. Null when nothing is left.
 */
export const visibleSpanOf = (
  element: ElementBox,
  elements: ElementBox[],
): InkEdges | null => {
  let left = element.x
  let right = element.x + element.width
  for (const ancestor of ancestorsOf(element, elements)) {
    if (ancestor.overflowX === 'visible') continue
    left = Math.max(left, ancestor.x)
    right = Math.min(right, ancestor.x + ancestor.width)
  }
  return right > left ? { left, right } : null
}
