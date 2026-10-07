import type { ElementBox } from '@/model/ElementBox.js'
import { EYEBROW_MAX_FONT_SIZE } from '@/rules/EYEBROW_MAX_FONT_SIZE.js'
import { EYEBROW_MAX_LENGTH } from '@/rules/EYEBROW_MAX_LENGTH.js'
import { EYEBROW_MIN_TRACKING_EM } from '@/rules/EYEBROW_MIN_TRACKING_EM.js'

/** Small, short text set in capitals or spaced out: a kicker or an eyebrow. */
export const isEyebrow = (element: ElementBox): boolean =>
  element.text !== '' &&
  element.textLength < EYEBROW_MAX_LENGTH &&
  element.fontSize <= EYEBROW_MAX_FONT_SIZE &&
  (element.textTransform === 'uppercase' ||
    element.letterSpacing / element.fontSize >= EYEBROW_MIN_TRACKING_EM)
