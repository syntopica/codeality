import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { CODE_TAGS } from '@/rules/CODE_TAGS.js'
import { isProseText } from '@/rules/isProseText.js'
import { isUserContent } from '@/rules/isUserContent.js'
import { MONOSPACE_FAMILY } from '@/rules/MONOSPACE_FAMILY.js'
import type { Rule } from '@/rules/Rule.js'

// A monospace face is for what is compared character by character: codes,
// ids, figures. Labels and names set in it ("Casilla 29", "Sin dato") look
// like a terminal printed into a sans interface. A page set in monospace
// throughout chose it, and code keeps its face.
export const monospaceProse: Rule = (snapshot) => {
  if (MONOSPACE_FAMILY.test(snapshot.bodyFontFamily)) return []
  return snapshot.elements.flatMap((element) => {
    if (element.text === '' || !MONOSPACE_FAMILY.test(element.fontFamily))
      return []
    if (!isProseText(element.text)) return []
    const chain = [element, ...ancestorsOf(element, snapshot.elements)]
    if (chain.some((box) => CODE_TAGS.has(box.tag))) return []
    if (isUserContent(element, snapshot.elements)) return []
    return [
      {
        rule: 'monospace-prose',
        severity: 'error',
        message: `"${element.text}" is words set in the monospace "${element.fontFamily}" on a page set in "${snapshot.bodyFontFamily}"; keep monospace for codes and figures`,
        subject: element.selector,
        identity: element.signature,
      },
    ]
  })
}
