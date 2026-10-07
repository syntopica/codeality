import { deltaE } from '@/color/deltaE.js'
import { rgbaToLab } from '@/color/rgbaToLab.js'
import type { ElementBox } from '@/model/ElementBox.js'
import { isPainted } from '@/rules/isPainted.js'
import { LEFT_BORDER_SIDE } from '@/rules/LEFT_BORDER_SIDE.js'
import { RIGHT_BORDER_SIDE } from '@/rules/RIGHT_BORDER_SIDE.js'
import { STRIPE_MIN_WIDTH } from '@/rules/STRIPE_MIN_WIDTH.js'

/**
 * `left` or `right` when that is the only side with a border of 3px or more
 * and its colour differs from the colour of the other sides' borders (which
 * may be none); null otherwise.
 */
export const stripeSideOf = (box: ElementBox): 'left' | 'right' | null => {
  const wide = box.borderWidths
    .map((width, side) => ({ width, side }))
    .filter(({ width }) => width >= STRIPE_MIN_WIDTH)
  const [only] = wide
  if (wide.length !== 1 || !only) return null
  if (only.side !== LEFT_BORDER_SIDE && only.side !== RIGHT_BORDER_SIDE)
    return null
  const stripe = box.borderColors[only.side]
  if (!isPainted(stripe)) return null
  const others = box.borderColors.filter(
    (color, side) =>
      side !== only.side &&
      (box.borderWidths[side] ?? 0) > 0 &&
      isPainted(color),
  )
  const same = others.some(
    (color) =>
      color !== null && deltaE(rgbaToLab(color), rgbaToLab(stripe)) <= 5,
  )
  if (same) return null
  return only.side === LEFT_BORDER_SIDE ? 'left' : 'right'
}
