import type { RawFinding } from '@/model/RawFinding.js'
import { isOnScreen } from '@/rules/isOnScreen.js'
import { PINNED_POSITIONS } from '@/rules/PINNED_POSITIONS.js'
import { pinnedHiddenOf } from '@/rules/pinnedHiddenOf.js'
import type { Rule } from '@/rules/Rule.js'
import { SCROLLABLE } from '@/rules/SCROLLABLE.js'
import { sticksAtAll } from '@/rules/sticksAtAll.js'

// A pinned sidebar taller than the window: the page scrolls, the sidebar does
// not, so whatever sits below the fold ("Sign out") can never be reached. A
// sticky panel as tall as its content is the same defect without overflow:
// its bottom shows only once the page has scrolled to the end, or never.
export const fixedOverflow: Rule = (snapshot) => {
  const findings: RawFinding[] = []
  for (const element of snapshot.elements) {
    if (
      !PINNED_POSITIONS.has(element.position) ||
      SCROLLABLE.has(element.overflowY)
    )
      continue
    const hidden = pinnedHiddenOf(element, snapshot.viewportHeight)
    if (hidden <= 2 || !sticksAtAll(element, snapshot.elements)) continue
    if (
      element.scrollHeight <= element.clientHeight + 2 &&
      !isOnScreen(element, snapshot)
    )
      continue
    const finding: RawFinding = {
      rule: 'fixed-overflow',
      severity: 'error',
      message: `${element.position} element holds ${String(Math.max(element.scrollHeight, element.height))}px of content in a ${String(snapshot.viewportHeight)}px window and cannot scroll; the last ${String(hidden)}px are unreachable while it is pinned (add overflow-y: auto and a max-height)`,
      subject: element.selector,
      identity: element.signature,
    }
    findings.push(finding)
  }
  return findings
}
