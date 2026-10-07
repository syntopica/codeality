import type { ElementBox } from '@/model/ElementBox.js'

/** A visible border on all four sides. */
export const hasFullBorder = (element: ElementBox): boolean =>
  element.borderWidths.every(
    (width, side) => width > 0 && (element.borderColors[side]?.[3] ?? 0) > 0,
  )
