import type { ElementBox } from '@/model/ElementBox.js'
import { isUpperCaseText } from '@/rules/isUpperCaseText.js'
import { LONG_TEXT_LENGTH } from '@/rules/LONG_TEXT_LENGTH.js'
import { MAX_TRACKING_EM } from '@/rules/MAX_TRACKING_EM.js'
import { MIN_TRACKING_EM } from '@/rules/MIN_TRACKING_EM.js'
import { SMALL_TEXT_FONT_SIZE } from '@/rules/SMALL_TEXT_FONT_SIZE.js'

/** What is wrong with an element's letter spacing, or null when nothing is. */
export const trackingFault = (element: ElementBox): string | null => {
  // Rounded to the thousandth, so -0.04em computed as -0.0400001 passes.
  const em =
    Math.round((element.letterSpacing / element.fontSize) * 1000) / 1000
  if (em < MIN_TRACKING_EM)
    return `letter-spacing of ${String(em)}em is tighter than ${String(MIN_TRACKING_EM)}em`
  if (element.letterSpacing < 0 && element.fontSize < SMALL_TEXT_FONT_SIZE)
    return `negative letter-spacing (${String(em)}em) on ${String(element.fontSize)}px text, under ${String(SMALL_TEXT_FONT_SIZE)}px`
  if (
    em > MAX_TRACKING_EM &&
    element.textLength > LONG_TEXT_LENGTH &&
    !isUpperCaseText(element)
  )
    return `letter-spacing of ${String(em)}em, over ${String(MAX_TRACKING_EM)}em, on lower-case text`
  return null
}
