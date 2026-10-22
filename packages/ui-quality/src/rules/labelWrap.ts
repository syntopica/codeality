import type { RawFinding } from '@/model/RawFinding.js'
import { childrenIndex } from '@/rules/childrenIndex.js'
import { labelValuePairsOf } from '@/rules/labelValuePairsOf.js'
import { labelWrapFindingOf } from '@/rules/labelWrapFindingOf.js'
import type { Rule } from '@/rules/Rule.js'

// A short label should use spare value width; its sibling SVG viewport belongs
// beside the first text line rather than centred on the whole wrapped block.
export const labelWrap: Rule = (snapshot) => {
  const children = childrenIndex(snapshot.elements)
  const findings: RawFinding[] = []
  for (const siblings of children.values()) {
    for (const [cell, value] of labelValuePairsOf(siblings, children)) {
      const finding = labelWrapFindingOf(
        cell,
        value,
        snapshot.elements,
        children,
      )
      if (finding) findings.push(finding)
    }
  }
  return findings
}
