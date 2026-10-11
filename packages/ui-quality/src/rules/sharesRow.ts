import type { ElementBox } from '@/model/ElementBox.js'

/** The two boxes overlap vertically: they sit side by side, not one above the other. */
export const sharesRow = (a: ElementBox, b: ElementBox): boolean =>
  a.y < b.y + b.height && b.y < a.y + a.height
