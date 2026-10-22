import type { LabelIconText } from '@/rules/LabelIconText.js'
import { MAX_LABEL_ICON_SCALE } from '@/rules/MAX_LABEL_ICON_SCALE.js'

/** Bound this alignment check to small label adornments rather than illustrations. */
export const isLabelIconViewport = ({ icon, text }: LabelIconText): boolean =>
  text.lineHeight > 0 &&
  icon.width > 0 &&
  icon.height > 0 &&
  Math.max(icon.width, icon.height) <= text.lineHeight * MAX_LABEL_ICON_SCALE
