import type { ElementBox } from '@/model/ElementBox.js'
import { RAGGED_EDGE_TOLERANCE } from '@/rules/RAGGED_EDGE_TOLERANCE.js'

/** An explicit `max-width` length, not the content, decides the box's width. */
export const isWidthCapped = (block: ElementBox): boolean =>
  block.maxWidth != null &&
  block.maxWidth > 0 &&
  Math.abs(block.width - block.maxWidth) <= RAGGED_EDGE_TOLERANCE
