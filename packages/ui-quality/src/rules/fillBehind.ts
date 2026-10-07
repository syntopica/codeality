import { blendOver } from '@/color/blendOver.js'
import type { ElementBox } from '@/model/ElementBox.js'
import type { Rgba } from '@/model/Rgba.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { backdropOf } from '@/rules/backdropOf.js'
import { isPainted } from '@/rules/isPainted.js'

/**
 * What an element's text sits on: its own fill over its ancestors', over the
 * page. Null when a gradient or image is painted anywhere on the way, since
 * its colour at the text cannot be read.
 */
export const fillBehind = (
  element: ElementBox,
  elements: ElementBox[],
  canvas: Rgba,
): Rgba | null => {
  const behind = backdropOf(element, elements, canvas)
  if (isPainted(element.backgroundColor)) {
    if (element.hasBackgroundImage) return null
    return blendOver(element.backgroundColor, behind)
  }
  for (const ancestor of ancestorsOf(element, elements)) {
    if (ancestor.hasBackgroundImage) return null
    if (ancestor.backgroundColor?.[3] === 1) break
  }
  return behind
}
