import type { ElementBox } from '@/model/ElementBox.js'
import { isLineClamped } from '@/rules/isLineClamped.js'

/** Estimate visible characters from horizontal extent and, for an active clamp, the visible height share. */
export const visibleCharsOf = (element: ElementBox): number =>
  Math.floor(
    ((element.textLength * element.clientWidth) /
      Math.max(element.scrollWidth, 1)) *
      (isLineClamped(element)
        ? element.clientHeight / Math.max(element.scrollHeight, 1)
        : 1),
  )
