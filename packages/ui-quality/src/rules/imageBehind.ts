import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { isPainted } from '@/rules/isPainted.js'

/**
 * Whether a gradient or image paints behind the element before the first
 * solid fill: the backdrop is then not one colour, and a contrast measured
 * against the fill further out would be against the wrong surface. With no
 * solid fill in between, the page canvas decides.
 */
export const imageBehind = (
  element: ElementBox,
  elements: ElementBox[],
  canvasHasImage: boolean,
): boolean => {
  for (const ancestor of ancestorsOf(element, elements)) {
    if (ancestor.hasBackgroundImage) return true
    if (isPainted(ancestor.backgroundColor)) return false
  }
  return canvasHasImage
}
