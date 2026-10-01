import type { ElementBox } from '@/model/ElementBox.js'
import { isPainted } from '@/rules/isPainted.js'

export const hasVisibleBorder = (element: ElementBox): boolean =>
  element.borderWidths.some(
    (width, side) => width > 0 && isPainted(element.borderColors[side] ?? null),
  )
