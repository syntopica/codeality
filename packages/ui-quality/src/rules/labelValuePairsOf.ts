import type { ElementBox } from '@/model/ElementBox.js'
import { rowGroups } from '@/rules/rowGroups.js'
import { sharesRow } from '@/rules/sharesRow.js'

/**
 * Label and value pairs among one parent's children: each `dt` with the `dd`
 * after it, or, in two or more like rows of exactly two cells side by side,
 * the first cell and the second.
 */
export const labelValuePairsOf = (
  siblings: ElementBox[],
  children: Map<number, ElementBox[]>,
): [ElementBox, ElementBox][] => {
  const pairs: [ElementBox, ElementBox][] = []
  siblings.forEach((label, index) => {
    const value = siblings[index + 1]
    if (label.tag === 'dt' && value?.tag === 'dd') pairs.push([label, value])
  })
  for (const rows of rowGroups(siblings, 2)) {
    for (const row of rows) {
      const [label, value, ...rest] = children.get(row.id) ?? []
      if (label && value && rest.length === 0 && sharesRow(label, value))
        pairs.push([label, value])
    }
  }
  return pairs
}
