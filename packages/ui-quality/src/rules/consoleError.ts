import { consoleMessageText } from '@/rules/consoleMessageText.js'
import type { Rule } from '@/rules/Rule.js'

// A page that logs errors while it loads is broken somewhere a screenshot
// cannot show: a missing translation, duplicate React keys, a failed script.
export const consoleError: Rule = (snapshot) =>
  [...new Set(snapshot.consoleErrors.map(consoleMessageText))].map((text) => ({
    rule: 'console-error',
    severity: 'error',
    message: `the page logged an error while loading: ${text}`,
    subject: 'console',
    identity: text,
  }))
