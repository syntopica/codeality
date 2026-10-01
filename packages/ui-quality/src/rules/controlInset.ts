import type { RawFinding } from '@/model/RawFinding.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { drawnSides } from '@/rules/drawnSides.js'
import { hasVisibleBorder } from '@/rules/hasVisibleBorder.js'
import { insetsWithin } from '@/rules/insetsWithin.js'
import { isPainted } from '@/rules/isPainted.js'
import type { Rule } from '@/rules/Rule.js'
import { SCROLLABLE } from '@/rules/SCROLLABLE.js'
import { SIDES } from '@/rules/SIDES.js'

// A bordered field glued to the edge of the bar or card it sits in: two
// lines on top of each other, the search box touching the header. Only the
// edges the container draws count, and a scroller in between ends the search:
// a field scrolled past a frame is not glued to it.
export const controlInset: Rule = (snapshot, context) => {
  const { minInset } = context.options.controlInset
  const findings: RawFinding[] = []
  for (const control of snapshot.elements) {
    if (!control.isControl || !hasVisibleBorder(control)) continue
    const container = ancestorsOf(control, snapshot.elements).find(
      (ancestor) =>
        hasVisibleBorder(ancestor) ||
        isPainted(ancestor.backgroundColor) ||
        SCROLLABLE.has(ancestor.overflowX) ||
        SCROLLABLE.has(ancestor.overflowY),
    )
    if (!container) continue
    // Past a scroller's edge a field is scrolled out of view, not glued.
    const scrolls =
      SCROLLABLE.has(container.overflowX) || SCROLLABLE.has(container.overflowY)
    const drawn = drawnSides(container)
    const insets = insetsWithin(control, container)
    const tight = insets
      .map((inset, side) => ({
        inset,
        side: SIDES[side] ?? 'top',
        index: side,
      }))
      .filter(
        ({ inset, index }) =>
          drawn[index] && inset < minInset && !(scrolls && inset < 0),
      )
    if (tight.length === 0) continue
    findings.push({
      rule: 'control-inset',
      severity: 'error',
      message: `bordered control sits ${tight.map(({ side, inset }) => `${String(inset)}px from the ${side}`).join(', ')} of ${container.selector}; keep at least ${String(minInset)}px`,
      subject: control.selector,
      identity: control.selector,
    })
  }
  return findings
}
