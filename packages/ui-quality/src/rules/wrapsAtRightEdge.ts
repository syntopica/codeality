import type { ElementBox } from '@/model/ElementBox.js'
import { descendantsOf } from '@/rules/descendantsOf.js'
import { RAGGED_EDGE_TOLERANCE } from '@/rules/RAGGED_EDGE_TOLERANCE.js'

/** Wrapped text shows a block's edge only when it shares that content boundary. */
export const wrapsAtRightEdge = (
  block: ElementBox,
  elements: ElementBox[],
): boolean => {
  const edge = block.x + block.width - block.padding[1] - block.borderWidths[1]
  return [block, ...descendantsOf(block, elements)].some(
    (box) =>
      box.lines >= 2 &&
      Math.abs(
        box.x + box.width - box.padding[1] - box.borderWidths[1] - edge,
      ) <= RAGGED_EDGE_TOLERANCE,
  )
}
