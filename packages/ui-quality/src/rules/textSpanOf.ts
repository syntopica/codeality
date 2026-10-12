import type { ElementBox } from '@/model/ElementBox.js'
import { descendantsOf } from '@/rules/descendantsOf.js'

/** The width the glyphs inside `root` take, from the leftmost to the rightmost; 0 without text. */
export const textSpanOf = (
  root: ElementBox,
  elements: ElementBox[],
): number => {
  const texts = [root, ...descendantsOf(root, elements)].filter(
    (box) => box.lines > 0,
  )
  if (texts.length === 0) return 0
  return (
    Math.max(...texts.map((box) => box.textRight)) -
    Math.min(...texts.map((box) => box.textLeft))
  )
}
