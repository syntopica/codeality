import type { ElementBox } from '@/model/ElementBox.js'

/**
 * Whether a pinned box ever stays put: a fixed one always, a sticky one only
 * when its parent runs taller than it. A sticky box as tall as its parent
 * scrolls with the page like any other.
 */
export const sticksAtAll = (
  element: ElementBox,
  elements: ElementBox[],
): boolean => {
  if (element.position !== 'sticky') return true
  const parent = element.parent === null ? null : elements[element.parent]
  return (
    parent !== undefined &&
    parent !== null &&
    parent.height > element.height + 2
  )
}
