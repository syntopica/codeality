import { blendOver } from '@/color/blendOver.js'
import { deltaE } from '@/color/deltaE.js'
import { rgbaToLab } from '@/color/rgbaToLab.js'
import type { ElementBox } from '@/model/ElementBox.js'
import type { Rgba } from '@/model/Rgba.js'
import { backdropOf } from '@/rules/backdropOf.js'
import { CARD_FILL_DELTA_E } from '@/rules/CARD_FILL_DELTA_E.js'
import { isPainted } from '@/rules/isPainted.js'

/** The element's fill, as the screen shows it, differs from what is behind it. */
export const standsOut = (
  element: ElementBox,
  elements: ElementBox[],
  canvas: Rgba,
): boolean => {
  if (!isPainted(element.backgroundColor)) return false
  const behind = backdropOf(element, elements, canvas)
  const shown = blendOver(element.backgroundColor, behind)
  return deltaE(rgbaToLab(shown), rgbaToLab(behind)) > CARD_FILL_DELTA_E
}
