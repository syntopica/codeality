import type { ElementBox } from '@/model/ElementBox.js'
import type { Rgba } from '@/model/Rgba.js'
import { hasContentSizedWidth } from '@/rules/hasContentSizedWidth.js'
import { holdsContent } from '@/rules/holdsContent.js'
import type { InkEdges } from '@/rules/InkEdges.js'
import { showsRightEdge } from '@/rules/showsRightEdge.js'
import { stacksOnLeftEdge } from '@/rules/stacksOnLeftEdge.js'

/** A block that starts on its column's left edge, alone in its row, holds content, shows where it ends and is not sized by its content. */
export const isRaggedCandidate = (
  block: ElementBox,
  blocks: ElementBox[],
  edges: InkEdges,
  scene: { elements: ElementBox[]; canvas: Rgba },
): boolean =>
  stacksOnLeftEdge(block, blocks, edges) &&
  !hasContentSizedWidth(block) &&
  holdsContent(block, scene.elements) &&
  showsRightEdge(block, scene.elements, scene.canvas)
