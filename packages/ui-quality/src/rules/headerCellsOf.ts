import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { descendantsOf } from '@/rules/descendantsOf.js'

/** The header cells of a table: those of its `thead`, else the `th` cells of its first row. */
export const headerCellsOf = (
  table: ElementBox,
  elements: ElementBox[],
): ElementBox[] => {
  const inside = descendantsOf(table, elements)
  const head = inside.find((element) => element.tag === 'thead')
  if (head)
    return inside.filter(
      (element) =>
        element.tag === 'th' &&
        ancestorsOf(element, elements).some((box) => box.id === head.id),
    )
  const firstRow = inside.find((element) => element.tag === 'tr')
  return firstRow
    ? inside.filter(
        (element) => element.tag === 'th' && element.parent === firstRow.id,
      )
    : []
}
