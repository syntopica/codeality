import { rgbaToOklch } from '@/color/rgbaToOklch.js'
import type { Rgba } from '@/model/Rgba.js'
import { PURPLE_MAX_HUE } from '@/rules/PURPLE_MAX_HUE.js'
import { PURPLE_MIN_CHROMA } from '@/rules/PURPLE_MIN_CHROMA.js'
import { PURPLE_MIN_HUE } from '@/rules/PURPLE_MIN_HUE.js'

/** A saturated colour in the purple range (OKLCH hue 260 to 310). */
export const isPurple = (color: Rgba): boolean => {
  const { c, h } = rgbaToOklch(color)
  return c > PURPLE_MIN_CHROMA && h >= PURPLE_MIN_HUE && h <= PURPLE_MAX_HUE
}
