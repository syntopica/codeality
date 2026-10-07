import type { ElementBox } from '@/model/ElementBox.js'
import { boxContains } from '@/rules/boxContains.js'
import { MIN_TAP_OVERLAP } from '@/rules/MIN_TAP_OVERLAP.js'

/**
 * Whether two boxes cross each other by more than a hairline on both axes
 * without one lying wholly inside the other: a stretched link laid over a
 * card is meant to hold what is inside it.
 */
export const overlapsPartly = (a: ElementBox, b: ElementBox): boolean =>
  Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) >
    MIN_TAP_OVERLAP &&
  Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) >
    MIN_TAP_OVERLAP &&
  !boxContains(a, b) &&
  !boxContains(b, a)
