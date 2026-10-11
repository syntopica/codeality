import type { ElementBox } from '@/model/ElementBox.js'
import { PROSE_TAGS } from '@/rules/PROSE_TAGS.js'

/** Running text: a paragraph-like element, or a box whose children are all paragraph-like. */
export const isProseBlock = (
  block: ElementBox,
  children: ElementBox[],
): boolean =>
  PROSE_TAGS.has(block.tag) ||
  (children.length > 0 && children.every((child) => PROSE_TAGS.has(child.tag)))
