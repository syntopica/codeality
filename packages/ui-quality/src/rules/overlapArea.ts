import type { ElementBox } from '@/model/ElementBox.js'

/** The area, in px², two boxes share. */
export const overlapArea = (a: ElementBox, b: ElementBox): number => {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return Math.max(0, width) * Math.max(0, height)
}
