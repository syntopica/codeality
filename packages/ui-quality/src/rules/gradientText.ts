import type { Rule } from '@/rules/Rule.js'

// Text filled with a gradient through `background-clip: text` is the most
// recognisable tell of a generated landing page: it trades legibility for
// decoration. Advisory.
export const gradientText: Rule = (snapshot) =>
  snapshot.elements.flatMap((element) =>
    element.clipsText && element.hasGradient && element.text !== ''
      ? [
          {
            rule: 'gradient-text',
            severity: 'warn' as const,
            message:
              'text is filled with a gradient (background-clip: text); set it in a solid colour',
            subject: element.selector,
            identity: element.signature,
          },
        ]
      : [],
  )
