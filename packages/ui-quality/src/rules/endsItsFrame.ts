import type { ElementBox } from '@/model/ElementBox.js'
import { hasVerticalScrollingContent } from '@/rules/hasVerticalScrollingContent.js'
import { isFrame } from '@/rules/isFrame.js'

/**
 * Whether nothing follows `element` before the card, panel or region around
 * it closes: it, and each wrapper up to that frame, is the last visible child
 * of its parent.
 */
export const endsItsFrame = (
  element: ElementBox,
  elements: ElementBox[],
  children: Map<number, ElementBox[]>,
): boolean => {
  let box = element
  while (box.parent !== null) {
    const parent = elements[box.parent]
    if (!parent) return false
    if ((children.get(parent.id) ?? []).at(-1) !== box) return false
    if (hasVerticalScrollingContent(parent)) return false
    if (isFrame(parent)) return true
    box = parent
  }
  return false
}
