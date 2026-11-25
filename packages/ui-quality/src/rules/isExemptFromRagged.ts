import type { ElementBox } from '@/model/ElementBox.js'
import type { Rgba } from '@/model/Rgba.js'
import { isCardLike } from '@/rules/isCardLike.js'
import { isProseBlock } from '@/rules/isProseBlock.js'
import { isReplacedOrControl } from '@/rules/isReplacedOrControl.js'
import { isWidthCapped } from '@/rules/isWidthCapped.js'

/**
 * Next to a full-width block, running text keeps its measure unless the cap is
 * an explicit `max-width` or that neighbour is a card. With no such neighbour
 * only a `max-width` cap on a box that is neither media nor a control is judged.
 */
export const isExemptFromRagged = (
  block: ElementBox,
  full: ElementBox | undefined,
  children: ElementBox[],
  scene: { elements: ElementBox[]; canvas: Rgba },
): boolean => {
  const capped = isWidthCapped(block)
  if (!full) return !capped || isReplacedOrControl(block)
  return (
    !capped &&
    isProseBlock(block, children) &&
    !isCardLike(full, scene.elements, scene.canvas)
  )
}
