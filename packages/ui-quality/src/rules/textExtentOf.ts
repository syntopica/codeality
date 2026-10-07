import type { ElementBox } from '@/model/ElementBox.js'
import { descendantsOf } from '@/rules/descendantsOf.js'
import type { InkEdges } from '@/rules/InkEdges.js'

/** Where the glyphs inside `root` (its own and its descendants') start and end; null when it holds no text. */
export const textExtentOf = (
  root: ElementBox,
  elements: ElementBox[],
): InkEdges | null => {
  const texts = [root, ...descendantsOf(root, elements)].filter(
    (element) => element.lines > 0,
  )
  if (texts.length === 0) return null
  return {
    left: Math.min(...texts.map((text) => text.textLeft)),
    right: Math.max(...texts.map((text) => text.textRight)),
  }
}
