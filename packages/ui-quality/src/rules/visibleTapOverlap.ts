import type { ElementBox } from '@/model/ElementBox.js'
import { MIN_TAP_OVERLAP } from '@/rules/MIN_TAP_OVERLAP.js'
import { visibleTapRects } from '@/rules/visibleTapRects.js'

/** Existing overlap tolerance applied to exposed fragments, without containment exemptions. */
export const visibleTapOverlap = (
  first: ElementBox,
  second: ElementBox,
): boolean => {
  for (const a of visibleTapRects(first)) {
    for (const b of visibleTapRects(second)) {
      if (
        Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) >
          MIN_TAP_OVERLAP &&
        Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) >
          MIN_TAP_OVERLAP
      )
        return true
    }
  }
  return false
}
