import { MAX_CONTROL_TRANSITION_MS } from '@/rules/MAX_CONTROL_TRANSITION_MS.js'
import type { Rule } from '@/rules/Rule.js'

// A transition on width, height, top, left, a margin or a padding makes the
// browser lay the page out every frame; transform and opacity do not. A
// control that takes longer than 300ms to answer feels stuck. `transition:
// all` is the sibling rule's, so it is not counted here.
export const layoutAnimation: Rule = (snapshot) =>
  snapshot.elements.flatMap((element) => {
    const findings = []
    if (element.layoutTransition)
      findings.push({
        rule: 'layout-animation',
        severity: 'warn' as const,
        message:
          'a transition animates layout (width, height, top, left, margin or padding); animate transform or opacity instead',
        subject: element.selector,
        identity: `layout:${element.signature}`,
      })
    if (
      (element.isControl || element.tappable) &&
      element.transitionMs > MAX_CONTROL_TRANSITION_MS
    )
      findings.push({
        rule: 'layout-animation',
        severity: 'warn' as const,
        message: `a control transitions for ${String(element.transitionMs)}ms; keep it to ${String(MAX_CONTROL_TRANSITION_MS)}ms or less`,
        subject: element.selector,
        identity: `duration:${element.signature}`,
      })
    return findings
  })
