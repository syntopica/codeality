import type { ElementBox } from '@/model/ElementBox.js'

/** The element holding a cell's text: the cell, or its sole descendant chain down to the text. */
export const textBoxOf = (
  cell: ElementBox,
  children: Map<number, ElementBox[]>,
): ElementBox | null => {
  let box = cell
  while (box.text === '') {
    const inner = children.get(box.id) ?? []
    const only = inner[0]
    if (inner.length !== 1 || !only) return null
    box = only
  }
  return box
}
