import { BORDER_NEIGHBOUR } from '@/rules/BORDER_NEIGHBOUR.js'
import { HAIRLINE } from '@/rules/HAIRLINE.js'
import { SPACING_STEP } from '@/rules/SPACING_STEP.js'
import { WHOLE_PIXEL } from '@/rules/WHOLE_PIXEL.js'

/**
 * Whether a spacing value is off the 4px scale. Hairlines (1px, 2px), a 3px
 * value next to a border and fractions (em and rem maths) are left alone.
 */
export const isOffScaleSpacing = (
  value: number,
  bordered: boolean,
): boolean => {
  if (value <= HAIRLINE) return false
  if (Math.abs(value - Math.round(value)) > WHOLE_PIXEL) return false
  if (value <= BORDER_NEIGHBOUR && bordered) return false
  return Math.round(value) % SPACING_STEP !== 0
}
