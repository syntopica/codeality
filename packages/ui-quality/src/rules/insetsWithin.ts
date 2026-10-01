import type { ElementBox } from '@/model/ElementBox.js'

/** Top, right, bottom and left distance from the inner box to the outer one. */
export const insetsWithin = (
  inner: ElementBox,
  outer: ElementBox,
): [number, number, number, number] => [
  inner.y - outer.y,
  outer.x + outer.width - (inner.x + inner.width),
  outer.y + outer.height - (inner.y + inner.height),
  inner.x - outer.x,
]
