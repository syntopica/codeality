import type { RawFinding } from '@/model/RawFinding.js'
import { childrenIndex } from '@/rules/childrenIndex.js'
import { LABEL_MAX_WORDS } from '@/rules/LABEL_MAX_WORDS.js'
import { labelValuePairsOf } from '@/rules/labelValuePairsOf.js'
import type { Rule } from '@/rules/Rule.js'
import { textBoxOf } from '@/rules/textBoxOf.js'
import { textSpanOf } from '@/rules/textSpanOf.js'

// "Presentado en la / AEAT ...... Sin dato": a short label broken onto two
// lines while the value beside it leaves most of its column empty. The label
// column is sized wrong, not the label too long.
export const labelWrap: Rule = (snapshot) => {
  const children = childrenIndex(snapshot.elements)
  const findings: RawFinding[] = []
  for (const siblings of children.values()) {
    for (const [cell, value] of labelValuePairsOf(siblings, children)) {
      const label = textBoxOf(cell, children)
      if (!label || label.lines < 2) continue
      if (label.text.split(/\s+/).length > LABEL_MAX_WORDS) continue
      const needed = (label.lines - 1) * (label.textRight - label.textLeft)
      const free = value.width - textSpanOf(value, snapshot.elements)
      if (free < needed + 8) continue
      findings.push({
        rule: 'label-wrap',
        severity: 'error',
        message: `the label "${label.text}" wraps onto ${String(label.lines)} lines while its value leaves ${String(Math.round(free))}px free; size the label column to its content (grid-template-columns: max-content 1fr)`,
        subject: label.selector,
        identity: cell.signature,
      })
    }
  }
  return findings
}
