import type { ElementBox } from '@/model/ElementBox.js'

/** A row's cells: descend through single-child wrappers such as `li > a`, stopping at a leaf. */
export const rowCells = (
  row: ElementBox,
  children: Map<number, ElementBox[]>,
): ElementBox[] => {
  let cells = children.get(row.id) ?? []
  for (let only = cells[0]; cells.length === 1 && only; only = cells[0]) {
    const inner = children.get(only.id) ?? []
    if (inner.length === 0) break
    cells = inner
  }
  return cells
}
