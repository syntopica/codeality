import type { ElementBox } from '@/model/ElementBox.js'
import { descendantsOf } from '@/rules/descendantsOf.js'
import type { InkEdges } from '@/rules/InkEdges.js'
import { isInk } from '@/rules/isInk.js'
import { visibleSpanOf } from '@/rules/visibleSpanOf.js'

/** Where the visible ink inside `root` starts and ends; null when it paints nothing. */
export const inkEdgesOf = (
  root: ElementBox,
  elements: ElementBox[],
): InkEdges | null => {
  const spans = descendantsOf(root, elements)
    .filter(isInk)
    .map((element) => visibleSpanOf(element, elements))
    .filter((span): span is InkEdges => span !== null)
  if (spans.length === 0) return null
  return {
    left: Math.min(...spans.map((span) => span.left)),
    right: Math.max(...spans.map((span) => span.right)),
  }
}
