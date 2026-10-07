import type { Rule } from '@/rules/Rule.js'

// A keyboard user has to see where focus is (WCAG 2.4.7). The Tab pass of the
// capture compares each focused element, and the boxes around it, with how
// they looked before: no outline, ring, border, fill or text colour change
// means `outline: none` was written with nothing put in its place.
export const focusInvisible: Rule = (snapshot) =>
  snapshot.focusStops.flatMap((stop) => {
    const element = snapshot.elements[stop.element]
    if (stop.changed || !element) return []
    return [
      {
        rule: 'focus-invisible',
        severity: 'warn',
        message: `keyboard focus on this ${element.tag} changes nothing visible (no outline, ring, border, fill or colour change); add a :focus-visible style`,
        subject: element.selector,
        identity: element.signature,
      },
    ]
  })
