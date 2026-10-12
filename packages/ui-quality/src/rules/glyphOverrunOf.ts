import type { ElementBox } from '@/model/ElementBox.js'
import { clipsOverflow } from '@/rules/clipsOverflow.js'

/**
 * How many px an element's glyphs run past the inner right edge of `frame`;
 * 0 when they stay inside, or when the frame clips the element's whole box,
 * which text-clipped reports.
 */
export const glyphOverrunOf = (
  element: ElementBox,
  frame: ElementBox,
): number => {
  const edge = frame.x + frame.width - frame.borderWidths[1]
  const past = element.textRight - edge
  if (past <= 1) return 0
  if (clipsOverflow(frame) && element.x + element.width > edge + 1) return 0
  return Math.round(past)
}
