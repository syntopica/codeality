import type { ElementBox } from '@/model/ElementBox.js'

/** The visible sibling just before `element`; null when it comes first. */
export const previousSiblingOf = (
  element: ElementBox,
  children: Map<number, ElementBox[]>,
): ElementBox | null => {
  if (element.parent === null) return null
  const siblings = children.get(element.parent) ?? []
  return siblings[siblings.indexOf(element) - 1] ?? null
}
