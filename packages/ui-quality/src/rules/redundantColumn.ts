import { childrenIndex } from '@/rules/childrenIndex.js'
import { MIN_REDUNDANT_COLUMN_ROWS } from '@/rules/MIN_REDUNDANT_COLUMN_ROWS.js'
import { pageValuesOf } from '@/rules/pageValuesOf.js'
import { rowTablesOf } from '@/rules/rowTablesOf.js'
import type { Rule } from '@/rules/Rule.js'
import { sharedColumnText } from '@/rules/sharedColumnText.js'

// A column whose cell says the same thing on every row carries no information;
// when that thing is already on the page as a breadcrumb or a picker value, it
// is the same fact stated once per row.
export const redundantColumn: Rule = (snapshot) => {
  const values = pageValuesOf(snapshot.elements)
  if (values.size === 0) return []
  const children = childrenIndex(snapshot.elements)
  return rowTablesOf(
    snapshot.elements,
    children,
    MIN_REDUNDANT_COLUMN_ROWS,
  ).flatMap(({ parent, cells }) =>
    (cells[0] ?? []).flatMap((_, column) => {
      const shared = sharedColumnText(cells, column, children)
      if (!shared || !values.has(shared.text)) return []
      return [
        {
          rule: 'redundant-column',
          severity: 'error' as const,
          message: `every row shows "${shared.text}" in this column, the value the page already shows in its breadcrumb or picker; drop the column`,
          subject: shared.selector,
          identity: `${parent?.selector ?? shared.selector}:${shared.text}`,
        },
      ]
    }),
  )
}
