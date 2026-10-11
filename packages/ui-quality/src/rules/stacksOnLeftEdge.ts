import type { ElementBox } from '@/model/ElementBox.js'
import type { InkEdges } from '@/rules/InkEdges.js'
import { RAGGED_EDGE_TOLERANCE } from '@/rules/RAGGED_EDGE_TOLERANCE.js'
import { sharesRow } from '@/rules/sharesRow.js'

/** The block starts on the column's left edge with nothing beside it: stacked, not centred or in a row. */
export const stacksOnLeftEdge = (
  block: ElementBox,
  blocks: ElementBox[],
  column: InkEdges,
): boolean =>
  Math.abs(block.x - column.left) <= RAGGED_EDGE_TOLERANCE &&
  !blocks.some((other) => other !== block && sharesRow(other, block))
