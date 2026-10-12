import type { ElementBox } from '@/model/ElementBox.js'
import { isPainted } from '@/rules/isPainted.js'

/** A visible bottom border with no left or right one: a divider, not a frame. */
export const drawsBottomRule = (element: ElementBox): boolean =>
  element.borderWidths[2] > 0 &&
  isPainted(element.borderColors[2]) &&
  !(element.borderWidths[1] > 0 && element.borderWidths[3] > 0)
