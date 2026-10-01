import type { RawFinding } from '@/model/RawFinding.js'
import { PINNED_POSITIONS } from '@/rules/PINNED_POSITIONS.js'
import type { Rule } from '@/rules/Rule.js'
import { SCROLLABLE } from '@/rules/SCROLLABLE.js'

// A pinned sidebar taller than the window: the page scrolls, the sidebar does
// not, so whatever sits below the fold ("Sign out") can never be reached.
export const fixedOverflow: Rule = (snapshot) => {
  const findings: RawFinding[] = []
  for (const element of snapshot.elements) {
    if (
      !PINNED_POSITIONS.has(element.position) ||
      SCROLLABLE.has(element.overflowY)
    )
      continue
    const hidden = element.y + element.scrollHeight - snapshot.viewportHeight
    if (element.scrollHeight <= element.clientHeight + 2 || hidden <= 2)
      continue
    const finding: RawFinding = {
      rule: 'fixed-overflow',
      severity: 'error',
      message: `${element.position} element holds ${String(element.scrollHeight)}px of content in a ${String(snapshot.viewportHeight)}px window and cannot scroll; the last ${String(hidden)}px are unreachable (add overflow-y: auto)`,
      subject: element.selector,
      identity: element.signature,
    }
    findings.push(finding)
  }
  return findings
}
