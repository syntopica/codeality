import type { Rule } from '@/rules/Rule.js'
import { trackingFault } from '@/rules/trackingFault.js'

// Letter spacing the font was not drawn for: tighter than -0.04em at any
// size, negative on text under 20px, or wider than 0.05em on lower-case
// words. Capitals and short labels may be tracked out.
export const letterSpacing: Rule = (snapshot) =>
  snapshot.elements.flatMap((element) => {
    if (element.text === '') return []
    const fault = trackingFault(element)
    if (!fault) return []
    return [
      {
        rule: 'letter-spacing',
        severity: 'warn',
        message: `${fault}; set it back to normal`,
        subject: element.selector,
        identity: element.signature,
      },
    ]
  })
