import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'

/** For each button label, the ids of the given rows that hold a button saying it. */
export const rowsByButtonLabel = (
  buttons: ElementBox[],
  rowIds: Set<number>,
  elements: ElementBox[],
): Map<string, Set<number>> => {
  const rows = new Map<string, Set<number>>()
  for (const button of buttons) {
    const row = ancestorsOf(button, elements).find((ancestor) =>
      rowIds.has(ancestor.id),
    )
    if (!row) continue
    rows.set(button.text, (rows.get(button.text) ?? new Set()).add(row.id))
  }
  return rows
}
