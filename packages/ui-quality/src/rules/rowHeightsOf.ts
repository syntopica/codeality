import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { descendantsOf } from '@/rules/descendantsOf.js'
import type { TableRows } from '@/rules/TableRows.js'

/** A table's header rows and body rows, each with the cells it holds. */
export const rowHeightsOf = (
  table: ElementBox,
  elements: ElementBox[],
): TableRows => {
  const rows = descendantsOf(table, elements).filter(
    (element) => element.tag === 'tr',
  )
  const cellsOf = (row: ElementBox): ElementBox[] =>
    elements.filter(
      (element) =>
        element.parent === row.id &&
        (element.tag === 'td' || element.tag === 'th'),
    )
  const inHead = (row: ElementBox): boolean =>
    ancestorsOf(row, elements).some((box) => box.tag === 'thead')
  return {
    header: rows.filter(inHead).map((row) => ({ row, cells: cellsOf(row) })),
    body: rows
      .filter((row) => !inHead(row))
      .map((row) => ({ row, cells: cellsOf(row) })),
  }
}
