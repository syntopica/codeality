import type { RawFinding } from '@/model/RawFinding.js'
import { childrenIndex } from '@/rules/childrenIndex.js'
import { danglingRuleOf } from '@/rules/danglingRuleOf.js'
import { MIN_DIVIDED_ITEMS } from '@/rules/MIN_DIVIDED_ITEMS.js'
import { rowGroups } from '@/rules/rowGroups.js'
import type { Rule } from '@/rules/Rule.js'

// `border-b` on every row draws a line under the last one too, where it
// separates the list from nothing: a stray rule at the bottom of the card.
// Dividers belong between items (`divide-y`), or the line earns its place
// above a footer or a total. Table rows are left alone.
export const listDanglingRule: Rule = (snapshot) => {
  const children = childrenIndex(snapshot.elements)
  const findings: RawFinding[] = []
  for (const [parent, siblings] of children) {
    const list = snapshot.elements[parent]
    if (!list) continue
    for (const rows of rowGroups(siblings, MIN_DIVIDED_ITEMS)) {
      const rule = danglingRuleOf(list, rows, snapshot.elements, children)
      if (!rule) continue
      findings.push({
        rule: 'list-dangling-rule',
        severity: 'error',
        message: `the last item of this list draws a bottom border with nothing after it in its card; put dividers between items (divide-y) or drop the last one`,
        subject: rule.selector,
        identity: list.signature,
      })
    }
  }
  return findings
}
