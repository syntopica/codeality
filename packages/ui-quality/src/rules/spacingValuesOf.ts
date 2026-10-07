import type { ElementBox } from '@/model/ElementBox.js'
import { isDefaultControlPadding } from '@/rules/isDefaultControlPadding.js'

/**
 * The padding, vertical margin and gap values an element sets, in px. The
 * horizontal margins are left out: `margin: auto` resolves to whatever width
 * is left over.
 */
export const spacingValuesOf = (element: ElementBox): number[] => [
  ...(isDefaultControlPadding(element) ? [] : element.padding),
  element.margin[0],
  element.margin[2],
  ...element.gap,
]
