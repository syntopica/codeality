import type { ElementBox } from '@/model/ElementBox.js'

/** The two boxes share some of their horizontal extent. */
export const overlapsHorizontally = (a: ElementBox, b: ElementBox): boolean =>
  a.x < b.x + b.width && b.x < a.x + a.width
