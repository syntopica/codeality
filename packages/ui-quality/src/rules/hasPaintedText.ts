import type { ElementBox } from '@/model/ElementBox.js'

/** Preserve unknown fills and glyphs painted through backgrounds or shadows. */
export const hasPaintedText = (element: ElementBox): boolean =>
  element.color?.[3] !== 0 ||
  element.clipsText ||
  element.textShadows.some((shadow) => shadow.color[3] > 0)
