import { DISPLAY_FONT_SIZE } from '@/rules/DISPLAY_FONT_SIZE.js'
import { MIN_LEADING } from '@/rules/MIN_LEADING.js'
import type { Rule } from '@/rules/Rule.js'

// Text that wraps onto two or more lines with a line height under 1.3 times
// its size: the lines crowd and the eye loses its place. Display type of
// 24px and up is set tight on purpose and left alone.
export const tightLeading: Rule = (snapshot) =>
  snapshot.elements.flatMap((element) => {
    if (element.lines < 2 || element.lineHeight <= 0) return []
    if (element.fontSize >= DISPLAY_FONT_SIZE) return []
    const leading = element.lineHeight / element.fontSize
    if (leading >= MIN_LEADING) return []
    return [
      {
        rule: 'tight-leading',
        severity: 'warn',
        message: `text wraps onto ${String(element.lines)} lines at a line height of ${leading.toFixed(2)} (${String(element.lineHeight)}px on ${String(element.fontSize)}px); give wrapped text at least ${String(MIN_LEADING)}`,
        subject: element.selector,
        identity: element.signature,
      },
    ]
  })
