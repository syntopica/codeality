import { MAX_HIDDEN_SHARE } from '@/rules/MAX_HIDDEN_SHARE.js'
import type { Rule } from '@/rules/Rule.js'

// A quarter or more of the main region's text laid out but painted
// invisible once the page has settled: a reveal animation that waits for a
// scroll or a script that never came, so a reader sees a blank page.
export const contentHiddenAtRest: Rule = (snapshot) => {
  const { total, hidden, selector } = snapshot.hiddenText
  if (total === 0 || hidden / total < MAX_HIDDEN_SHARE) return []
  return [
    {
      rule: 'content-hidden-at-rest',
      severity: 'warn',
      message: `${String(Math.round((hidden / total) * 100))}% of the main region's text (${String(hidden)} of ${String(total)} characters) is laid out but invisible at rest, at opacity 0 or visibility hidden; show it without waiting for an animation`,
      subject: selector,
      identity: 'content-hidden-at-rest',
    },
  ]
}
