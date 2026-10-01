import type { ElementBox } from '@/model/ElementBox.js'

/** Nearest first. Element ids are their index in the snapshot. */
export const ancestorsOf = (
  element: ElementBox,
  elements: ElementBox[],
): ElementBox[] => {
  const chain: ElementBox[] = []
  let parent = element.parent
  while (parent !== null) {
    const ancestor = elements[parent]
    if (!ancestor) break
    chain.push(ancestor)
    parent = ancestor.parent
  }
  return chain
}
