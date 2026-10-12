import type { RawFinding } from '@/model/RawFinding.js'
import { childrenIndex } from '@/rules/childrenIndex.js'
import { DECIMAL_AMOUNT_TEXT } from '@/rules/DECIMAL_AMOUNT_TEXT.js'
import { firstTextMatching } from '@/rules/firstTextMatching.js'
import { MIN_AMOUNT_ROWS } from '@/rules/MIN_AMOUNT_ROWS.js'
import { namesUnit } from '@/rules/namesUnit.js'
import { rowGroups } from '@/rules/rowGroups.js'
import type { Rule } from '@/rules/Rule.js'

// "4,20", "10,50", "1.505,69" down a list: euros, a rate or a count? A table
// whose column header names the column is read by it; a bare list, with no
// unit on the amounts and no heading or caption that names one, is not.
export const moneyWithoutUnit: Rule = (snapshot) => {
  const findings: RawFinding[] = []
  for (const [parent, siblings] of childrenIndex(snapshot.elements)) {
    const list = snapshot.elements[parent]
    if (!list) continue
    for (const rows of rowGroups(siblings, MIN_AMOUNT_ROWS)) {
      const amounts = rows
        .map((row) =>
          firstTextMatching(row, snapshot.elements, DECIMAL_AMOUNT_TEXT),
        )
        .filter((amount) => amount !== null)
      if (amounts.length < MIN_AMOUNT_ROWS) continue
      if (namesUnit(list, rows, snapshot.elements)) continue
      findings.push({
        rule: 'money-without-unit',
        severity: 'error',
        message: `${String(amounts.length)} amounts in this list (${amounts
          .slice(0, 3)
          .map((amount) => `"${amount.text}"`)
          .join(
            ', ',
          )}) carry no currency or unit, and no header or caption names one; add "€" (or the unit) to the amounts or to a header`,
        subject: list.selector,
        identity: list.signature,
      })
    }
  }
  return findings
}
