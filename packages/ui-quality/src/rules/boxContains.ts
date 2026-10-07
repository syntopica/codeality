import type { ElementBox } from '@/model/ElementBox.js'

/** Whether the second box lies wholly inside the first. */
export const boxContains = (outer: ElementBox, inner: ElementBox): boolean =>
  outer.x <= inner.x &&
  outer.y <= inner.y &&
  outer.x + outer.width >= inner.x + inner.width &&
  outer.y + outer.height >= inner.y + inner.height
