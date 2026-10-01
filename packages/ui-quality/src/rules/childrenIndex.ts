import type { ElementBox } from '@/model/ElementBox.js'

/** Visible children of every element, in document order, keyed by parent id. */
export const childrenIndex = (
  elements: ElementBox[],
): Map<number, ElementBox[]> => {
  const index = new Map<number, ElementBox[]>()
  for (const element of elements) {
    if (element.parent === null) continue
    const siblings = index.get(element.parent) ?? []
    siblings.push(element)
    index.set(element.parent, siblings)
  }
  return index
}
