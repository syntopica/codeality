import type { ElementBox } from '@/model/ElementBox.js'
import type { Rgba } from '@/model/Rgba.js'
import { hasFullBorder } from '@/rules/hasFullBorder.js'
import { standsOut } from '@/rules/standsOut.js'
import { wrapsAtRightEdge } from '@/rules/wrapsAtRightEdge.js'

/**
 * The box's right edge can be seen: it draws a border, a shadow or a distinct
 * fill, or text inside it wraps there. A one-line heading in a capped box
 * looks the same as in a full-width one, so its width alone says nothing.
 */
export const showsRightEdge = (
  block: ElementBox,
  elements: ElementBox[],
  canvas: Rgba,
): boolean =>
  hasFullBorder(block) ||
  block.shadowBlur > 0 ||
  standsOut(block, elements, canvas) ||
  wrapsAtRightEdge(block, elements)
