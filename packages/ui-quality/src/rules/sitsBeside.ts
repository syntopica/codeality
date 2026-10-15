import type { ElementBox } from '@/model/ElementBox.js'
import { CONTROL_ROW_OVERLAP } from '@/rules/CONTROL_ROW_OVERLAP.js'

/**
 * Two controls side by side on one line: they overlap vertically by over half
 * the shorter one, and the space between them is at most `maxGap`. A control
 * drawn over another (a button inside a field) is not beside it; a shared 1px
 * border is.
 */
export const sitsBeside = (
  a: ElementBox,
  b: ElementBox,
  maxGap: number,
): boolean => {
  const overlap = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  const gap = Math.max(a.x, b.x) - Math.min(a.x + a.width, b.x + b.width)
  return (
    overlap > CONTROL_ROW_OVERLAP * Math.min(a.height, b.height) &&
    gap >= -1 &&
    gap <= maxGap
  )
}
