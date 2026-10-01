import type { RawFinding } from '@/model/RawFinding.js'
import { childrenIndex } from '@/rules/childrenIndex.js'
import { hardCutColumn } from '@/rules/hardCutColumn.js'
import { rowGroups } from '@/rules/rowGroups.js'
import { rowTexts } from '@/rules/rowTexts.js'
import type { Rule } from '@/rules/Rule.js'

// Previews sliced to N characters by the server and printed as they are:
// "...en cuanto estemos d". CSS cannot see it, because nothing overflows.
export const textHardCut: Rule = (snapshot, context) => {
  const { minRows } = context.options.rowMisaligned
  const children = childrenIndex(snapshot.elements)
  const findings: RawFinding[] = []
  for (const siblings of children.values()) {
    for (const rows of rowGroups(siblings, minRows)) {
      const table = rows.map((row) => rowTexts(row, snapshot.elements))
      const width = Math.max(...table.map((cells) => cells.length))
      for (let column = 0; column < width; column++) {
        const cells = table
          .map((cells) => cells[column])
          .filter((cell) => cell !== undefined)
        const hit = hardCutColumn(cells, 30)
        const example = hit?.cut[0]
        if (!hit || !example) continue
        findings.push({
          rule: 'text-hard-cut',
          severity: 'error',
          message: `${String(hit.cut.length)} texts in this column stop at exactly ${String(hit.length)} characters with no ellipsis, e.g. "…${example.text.slice(-30)}"; send the full text and truncate in CSS, or append "…"`,
          subject: example.selector,
          identity: example.signature,
        })
      }
    }
  }
  return findings
}
