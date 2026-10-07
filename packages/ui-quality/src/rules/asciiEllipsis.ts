import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { ASCII_ELLIPSIS } from '@/rules/ASCII_ELLIPSIS.js'
import { CODE_TAGS } from '@/rules/CODE_TAGS.js'
import type { Rule } from '@/rules/Rule.js'

// "Loading..." is three full stops; "Loading…" is one character that never
// breaks across lines and sets at the right width. Code and other literal
// text keep theirs.
export const asciiEllipsis: Rule = (snapshot) =>
  snapshot.elements.flatMap((element) => {
    if (!ASCII_ELLIPSIS.test(element.text) && element.textTail !== '...')
      return []
    const chain = [element, ...ancestorsOf(element, snapshot.elements)]
    if (chain.some((box) => CODE_TAGS.has(box.tag))) return []
    return [
      {
        rule: 'ascii-ellipsis',
        severity: 'warn',
        message: `"${element.text}" spells an ellipsis with three full stops; use the single character …`,
        subject: element.selector,
        identity: element.signature,
      },
    ]
  })
