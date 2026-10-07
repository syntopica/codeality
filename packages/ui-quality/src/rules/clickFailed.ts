import type { Rule } from '@/rules/Rule.js'

// The screen behind a click, scroll, hover or focus was never reached, so
// everything measured here describes the page before it: the route needs a
// working selector. A click keeps its bare selector as identity, as before
// the other interactions existed.
export const clickFailed: Rule = (snapshot) =>
  snapshot.interactionFailures.map(({ action, selector }) => ({
    rule: 'click-failed',
    severity: 'error',
    message: `nothing matched "${selector}" to ${action}, so the screen behind it was not measured`,
    subject: selector,
    identity: action === 'click' ? selector : `${action} ${selector}`,
  }))
