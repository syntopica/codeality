import type { ElementBox } from '@/model/ElementBox.js'
import { SCROLLABLE } from '@/rules/SCROLLABLE.js'

/** A vertical scroll boundary with content beyond its client box. */
export const hasVerticalScrollingContent = (box: ElementBox): boolean =>
  SCROLLABLE.has(box.overflowY) && box.scrollHeight > box.clientHeight + 2
