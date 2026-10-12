import type { ElementBox } from '@/model/ElementBox.js'
import { descendantsOf } from '@/rules/descendantsOf.js'
import { UNIT_TEXT } from '@/rules/UNIT_TEXT.js'

/**
 * Whether anything around a list, outside its rows, names a unit or heads a
 * column: a header cell, or a heading or caption with a currency or percent.
 * The rows' own amounts are bare by the time this is asked.
 */
export const namesUnit = (
  list: ElementBox,
  rows: ElementBox[],
  elements: ElementBox[],
): boolean => {
  const scope = list.parent === null ? list : (elements[list.parent] ?? list)
  const inRows = new Set(
    rows.flatMap((row) => [row, ...descendantsOf(row, elements)]),
  )
  return [scope, ...descendantsOf(scope, elements)].some(
    (box) =>
      box.tag === 'th' ||
      box.role === 'columnheader' ||
      (!inRows.has(box) && UNIT_TEXT.test(box.text)),
  )
}
