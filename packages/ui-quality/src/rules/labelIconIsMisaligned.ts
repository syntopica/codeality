import { isLabelIconViewport } from '@/rules/isLabelIconViewport.js'
import type { LabelIconText } from '@/rules/LabelIconText.js'
import { MAX_LABEL_ICON_OFFSET } from '@/rules/MAX_LABEL_ICON_OFFSET.js'

/** Compare viewport geometry only; internal SVG artwork is not optically measured. */
export const labelIconIsMisaligned = ({ icon, text }: LabelIconText): boolean =>
  isLabelIconViewport({ icon, text }) &&
  (icon.x + icon.width <= text.x + 2 || text.x + text.width <= icon.x + 2) &&
  icon.y < text.y + text.height &&
  icon.y + icon.height > text.y &&
  typeof text.firstTextLineCenterY === 'number' &&
  Number.isFinite(text.firstTextLineCenterY) &&
  Math.abs(icon.y + icon.height / 2 - text.firstTextLineCenterY) >
    MAX_LABEL_ICON_OFFSET
