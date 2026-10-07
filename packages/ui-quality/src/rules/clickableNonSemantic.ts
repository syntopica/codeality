import { ancestorsOf } from '@/rules/ancestorsOf.js'
import type { Rule } from '@/rules/Rule.js'

// A pointer cursor says "click me"; on a div or a span that is not a link,
// a button or an ARIA widget it is a click target with no role and no
// keyboard. The cursor is inherited, so only the topmost box of a pointer
// area is judged, and a wrapper around a real link or button is left alone.
export const clickableNonSemantic: Rule = (snapshot) =>
  snapshot.elements.flatMap((element) => {
    if (element.cursor !== 'pointer' || element.semantic) return []
    if (element.wrapsInteractive || element.disabled) return []
    const parent = ancestorsOf(element, snapshot.elements)[0]
    if (parent?.cursor === 'pointer') return []
    return [
      {
        rule: 'clickable-non-semantic',
        severity: 'warn',
        message: `${element.tag} shows a pointer cursor but is not a link, button or widget with a role; use a <button> or <a href>`,
        subject: element.selector,
        identity: element.signature,
      },
    ]
  })
