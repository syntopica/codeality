import type { Rule } from '@/rules/Rule.js'

// A sort or search that does nothing, or the wrong thing, looks correct on
// every screenshot: it is only found by using it. So does a toolbar that
// changes height when a toggle is pressed.
export const behaviourBroken: Rule = (snapshot) =>
  snapshot.behaviour.map((failure) => ({
    rule: failure.rule,
    severity: 'error',
    message: failure.message,
    subject: failure.subject,
    identity: failure.subject,
  }))
