import type { RawFinding } from '@/model/RawFinding.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { clipsOverflow } from '@/rules/clipsOverflow.js'
import type { Rule } from '@/rules/Rule.js'
import { SCROLLABLE } from '@/rules/SCROLLABLE.js'

// Two ways text is cut without telling the reader: the element clips its own
// overflow with no ellipsis, or it grows past an ancestor that clips. The
// second is the `truncate` that never fires because a flex child without
// `min-width: 0` is as wide as its text. A horizontal scroller between the
// text and the clipper keeps the text reachable: a tab strip or a wide table
// scrolled sideways is not cut, so the search stops there.
export const textClipped: Rule = (snapshot) => {
  const findings: RawFinding[] = []
  for (const element of snapshot.elements) {
    if (element.text === '') continue
    const ownOverflow = element.scrollWidth - element.clientWidth
    if (
      clipsOverflow(element) &&
      ownOverflow > 1 &&
      element.textOverflow !== 'ellipsis'
    ) {
      findings.push({
        rule: 'text-clipped',
        severity: 'error',
        message: `text is cut ${String(ownOverflow)}px short with no ellipsis: "${element.text}"`,
        subject: element.selector,
        identity: element.selector,
      })
      continue
    }
    const clipper = ancestorsOf(element, snapshot.elements).find(
      (ancestor) =>
        clipsOverflow(ancestor) || SCROLLABLE.has(ancestor.overflowX),
    )
    if (!clipper || !clipsOverflow(clipper)) continue
    const past = Math.max(
      element.x + element.width - (clipper.x + clipper.width),
      clipper.x - element.x,
    )
    if (past > 1) {
      findings.push({
        rule: 'text-clipped',
        severity: 'error',
        message: `text runs ${String(past)}px past ${clipper.selector}, which clips it: "${element.text}"`,
        subject: element.selector,
        identity: element.selector,
      })
    }
  }
  return findings
}
