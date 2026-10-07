import type { ElementBox } from '@/model/ElementBox.js'

/** The font size to a tenth of a pixel, so float noise does not count as a step. */
export const roundedFontSize = (element: ElementBox): number =>
  Math.round(element.fontSize * 10) / 10
