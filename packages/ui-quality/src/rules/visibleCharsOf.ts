import type { ElementBox } from '@/model/ElementBox.js'

/** Roughly how many characters of an ellipsized text show: its length scaled by the share of its width on screen. */
export const visibleCharsOf = (element: ElementBox): number =>
  Math.floor(
    (element.textLength * element.clientWidth) /
      Math.max(element.scrollWidth, 1),
  )
