import type { ElementBox } from '@/model/ElementBox.js'
import { descendantsOf } from '@/rules/descendantsOf.js'
import type { InkEdges } from '@/rules/InkEdges.js'
import { isFixedWithin } from '@/rules/isFixedWithin.js'
import { isFullBleedBand } from '@/rules/isFullBleedBand.js'
import { isInk } from '@/rules/isInk.js'
import { visibleSpanOf } from '@/rules/visibleSpanOf.js'

/**
 * Where the content inside `root` starts and ends, for lining it up with
 * another region. Two kinds of ink are not content: a fill or rule that spans
 * the whole root (a full-bleed section band), and anything fixed in place (a
 * drawer laid over the page). Null when nothing is left.
 */
export const alignmentEdgesOf = (
  root: ElementBox,
  elements: ElementBox[],
): InkEdges | null => {
  const spans: InkEdges[] = []
  for (const element of descendantsOf(root, elements)) {
    if (!isInk(element) || isFixedWithin(element, root, elements)) continue
    const span = visibleSpanOf(element, elements)
    if (span && !isFullBleedBand(element, span, root)) spans.push(span)
  }
  if (spans.length === 0) return null
  return {
    left: Math.min(...spans.map((span) => span.left)),
    right: Math.max(...spans.map((span) => span.right)),
  }
}
