import { rowHeightFault } from '@/rules/rowHeightFault.js'
import { rowHeightsOf } from '@/rules/rowHeightsOf.js'
import type { Rule } from '@/rules/Rule.js'

// Rows of one table share a height: a ragged one reads as a data problem, and
// a header taller or shorter than the rows it names breaks the grid. Rows
// that wrap on purpose are not compared.
export const rowHeightScale: Rule = (snapshot) =>
  snapshot.elements.flatMap((table) => {
    if (table.tag !== 'table') return []
    const fault = rowHeightFault(rowHeightsOf(table, snapshot.elements))
    if (!fault) return []
    return [
      {
        rule: 'row-height-scale',
        severity: 'warn',
        message: `${fault}; give the rows one height`,
        subject: table.selector,
        identity: table.selector,
      },
    ]
  })
