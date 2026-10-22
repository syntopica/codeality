import type { ElementBox } from '@/model/ElementBox.js'

/** Find exactly two sibling branches through otherwise plain label wrappers. */
export const labelCompositionBranchesOf = (
  cell: ElementBox,
  children: Map<number, ElementBox[]>,
): [ElementBox, ElementBox] | null => {
  let box = cell
  while (box.text === '') {
    const inner = children.get(box.id) ?? []
    if (inner.length === 2 && inner[0] && inner[1]) return [inner[0], inner[1]]
    if (inner.length !== 1 || !inner[0]) return null
    box = inner[0]
  }
  return null
}
