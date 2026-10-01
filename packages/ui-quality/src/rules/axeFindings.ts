import { BLOCKING_IMPACTS } from '@/rules/BLOCKING_IMPACTS.js'
import type { Rule } from '@/rules/Rule.js'

// One finding per axe rule per screen: two hundred low-contrast rows are one
// defect with one cause, and the message keeps the count and an example.
export const axeFindings: Rule = (snapshot) =>
  snapshot.axe.map((violation) => {
    const example = violation.nodes[0]
    return {
      rule: `a11y/${violation.id}`,
      severity: BLOCKING_IMPACTS.has(violation.impact ?? '') ? 'error' : 'warn',
      message: `${violation.help}: ${String(violation.nodes.length)} element(s)${example ? `; e.g. ${example.summary}` : ''}`,
      subject: example?.target ?? '',
      identity: violation.id,
    }
  })
