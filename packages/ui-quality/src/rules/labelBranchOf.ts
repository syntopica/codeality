import type { ElementBox } from '@/model/ElementBox.js'

/** Follow plain single-child wrappers to one SVG or a leaf with own text. */
export const labelBranchOf = (
  element: ElementBox,
  children: Map<number, ElementBox[]>,
): ElementBox | null => {
  let box = element
  while (box.tag !== 'svg') {
    const inner = children.get(box.id) ?? []
    if (box.text !== '') return inner.length === 0 ? box : null
    if (inner.length !== 1 || !inner[0]) return null
    box = inner[0]
  }
  return box
}
