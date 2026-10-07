import { rgbaToOklch } from '@/color/rgbaToOklch.js'
import type { Rgba } from '@/model/Rgba.js'
import { COLORED_MIN_CHROMA } from '@/rules/COLORED_MIN_CHROMA.js'
import { GRAY_MAX_CHROMA } from '@/rules/GRAY_MAX_CHROMA.js'
import { GRAY_MAX_LIGHTNESS } from '@/rules/GRAY_MAX_LIGHTNESS.js'
import { GRAY_MIN_LIGHTNESS } from '@/rules/GRAY_MIN_LIGHTNESS.js'

/** A mid-grey text colour (low chroma, middle lightness) on a background that is clearly coloured. */
export const isGrayOnColor = (text: Rgba, background: Rgba): boolean => {
  const ink = rgbaToOklch(text)
  return (
    ink.c < GRAY_MAX_CHROMA &&
    ink.l >= GRAY_MIN_LIGHTNESS &&
    ink.l <= GRAY_MAX_LIGHTNESS &&
    rgbaToOklch(background).c > COLORED_MIN_CHROMA
  )
}
