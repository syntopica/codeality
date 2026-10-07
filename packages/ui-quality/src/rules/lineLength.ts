import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { MAX_MEASURE_CH } from '@/rules/MAX_MEASURE_CH.js'
import { PROSE_TAGS } from '@/rules/PROSE_TAGS.js'
import type { Rule } from '@/rules/Rule.js'
import { TABULAR_TAGS } from '@/rules/TABULAR_TAGS.js'

// Running text is read best at 45 to 75 characters a line; past 80 the eye
// loses the next line on the way back. Only wrapped paragraphs and list items
// are measured (one line has no measure), and not inside tables or code.
export const lineLength: Rule = (snapshot) =>
  snapshot.elements.flatMap((element) => {
    if (
      !PROSE_TAGS.has(element.tag) ||
      element.measureCh <= MAX_MEASURE_CH ||
      ancestorsOf(element, snapshot.elements).some((box) =>
        TABULAR_TAGS.has(box.tag),
      )
    )
      return []
    return [
      {
        rule: 'line-length',
        severity: 'warn',
        message: `a paragraph is set ${String(Math.round(element.measureCh))} characters wide; cap its width near ${String(MAX_MEASURE_CH)}ch (max-width: 70ch)`,
        subject: element.selector,
        identity: element.signature,
      },
    ]
  })
