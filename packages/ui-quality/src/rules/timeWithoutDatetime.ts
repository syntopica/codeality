import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { isTimestampText } from '@/rules/isTimestampText.js'
import type { Rule } from '@/rules/Rule.js'
import { TIMESTAMP_HOSTS } from '@/rules/TIMESTAMP_HOSTS.js'

// A timestamp in a row is data: "5 min ago" should be a <time datetime> so
// that machines and assistive tech read the moment, or carry a title with the
// exact one for a person who hovers. Only a text that is wholly a time or a
// date, inside a cell or list item, is judged, so a sentence that mentions
// one is not.
export const timeWithoutDatetime: Rule = (snapshot) =>
  snapshot.elements.flatMap((element) => {
    if (element.text === '' || !isTimestampText(element.text)) return []
    const chain = [element, ...ancestorsOf(element, snapshot.elements)]
    if (!chain.some((box) => TIMESTAMP_HOSTS.has(box.tag))) return []
    if (chain.some((box) => box.datetime || box.hasTitle)) return []
    return [
      {
        rule: 'time-without-datetime',
        severity: 'warn',
        message: `"${element.text}" is a time with no <time datetime> and no title carrying the exact moment`,
        subject: element.selector,
        identity: element.signature,
      },
    ]
  })
