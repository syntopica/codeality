import { amountTextOf } from '@/rules/amountTextOf.js'
import { childrenIndex } from '@/rules/childrenIndex.js'
import { itemsAbove } from '@/rules/itemsAbove.js'
import type { Rule } from '@/rules/Rule.js'
import { TOTAL_LABEL } from '@/rules/TOTAL_LABEL.js'
import { totalRowOf } from '@/rules/totalRowOf.js'

// A "Total" under a list of one item repeats that item: a line of chrome that
// adds nothing. It earns its place from two items up.
export const redundantTotal: Rule = (snapshot) => {
  const children = childrenIndex(snapshot.elements)
  return snapshot.elements.flatMap((label) => {
    if (!TOTAL_LABEL.test(label.text)) return []
    const row = totalRowOf(label, snapshot.elements)
    if (!row) return []
    const total = amountTextOf(row, snapshot.elements)
    const items = itemsAbove(row, snapshot.elements, children)
    const only = items[0]
    if (items.length !== 1 || !only) return []
    if (amountTextOf(only, snapshot.elements) !== total) return []
    return [
      {
        rule: 'redundant-total',
        severity: 'error',
        message: `the "${label.text}" row repeats the single item above it (${total ?? ''}); show a total only under two or more items`,
        subject: row.selector,
        identity: row.signature,
      },
    ]
  })
}
