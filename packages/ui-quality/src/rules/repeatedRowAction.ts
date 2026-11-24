import { childrenIndex } from '@/rules/childrenIndex.js'
import { isLabelledButton } from '@/rules/isLabelledButton.js'
import { MIN_ROW_ACTION_ROWS } from '@/rules/MIN_ROW_ACTION_ROWS.js'
import { rowsByButtonLabel } from '@/rules/rowsByButtonLabel.js'
import { rowTablesOf } from '@/rules/rowTablesOf.js'
import type { Rule } from '@/rules/Rule.js'

// The same word on a button in every row is a column of identical text; an
// icon with a tooltip says it once and leaves the row's own data to read.
export const repeatedRowAction: Rule = (snapshot) => {
  const { elements } = snapshot
  const buttons = elements.filter(isLabelledButton)
  if (buttons.length < MIN_ROW_ACTION_ROWS) return []
  return rowTablesOf(
    elements,
    childrenIndex(elements),
    MIN_ROW_ACTION_ROWS,
  ).flatMap(({ parent, cells }) => {
    const rowIds = new Set(cells.flatMap((row) => row[0]?.parent ?? []))
    return [...rowsByButtonLabel(buttons, rowIds, elements)]
      .filter(([, rows]) => rows.size >= MIN_ROW_ACTION_ROWS)
      .map(([label, rows]) => ({
        rule: 'repeated-row-action',
        severity: 'error' as const,
        message: `${String(rows.size)} rows carry the button "${label}"; use an icon with a tooltip`,
        subject: parent?.selector ?? label,
        identity: `${parent?.selector ?? ''}:${label}`,
      }))
  })
}
