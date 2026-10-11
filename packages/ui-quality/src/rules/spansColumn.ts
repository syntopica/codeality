import type { ElementBox } from '@/model/ElementBox.js'
import type { InkEdges } from '@/rules/InkEdges.js'
import { RAGGED_EDGE_TOLERANCE } from '@/rules/RAGGED_EDGE_TOLERANCE.js'

/** The block reaches both edges of its column. */
export const spansColumn = (block: ElementBox, column: InkEdges): boolean =>
  block.x <= column.left + RAGGED_EDGE_TOLERANCE &&
  block.x + block.width >= column.right - RAGGED_EDGE_TOLERANCE
