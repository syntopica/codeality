import type { Rule } from '@/rules/Rule.js'

// The screen behind a click was never reached, so everything measured here
// describes the page before it: the route needs a working selector.
export const clickFailed: Rule = (snapshot) =>
  snapshot.clickFailures.map((selector) => ({
    rule: 'click-failed',
    severity: 'error',
    message: `nothing matched "${selector}" to click, so the screen behind it was not measured`,
    subject: selector,
    identity: selector,
  }))
