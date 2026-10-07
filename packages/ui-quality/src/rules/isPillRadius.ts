import type { ElementBox } from '@/model/ElementBox.js'

/** A radius that rounds the short side off completely: a pill or a circle, a shape rather than a scale step. */
export const isPillRadius = (element: ElementBox): boolean =>
  element.borderRadius >= Math.min(element.width, element.height) / 2
