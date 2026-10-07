import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { FUNCTIONAL_TEXT_TAGS } from '@/rules/FUNCTIONAL_TEXT_TAGS.js'
import { MIN_BODY_FONT_SIZE } from '@/rules/MIN_BODY_FONT_SIZE.js'
import { MIN_UI_FONT_SIZE } from '@/rules/MIN_UI_FONT_SIZE.js'
import type { Rule } from '@/rules/Rule.js'
import { SMALL_TEXT_TAGS } from '@/rules/SMALL_TEXT_TAGS.js'

// Text under 11px in a control, link, label, cell or navigation, or under
// 12px anywhere else, is too small to read at arm's length. Superscripts,
// subscripts and code are small by design; screen-reader-only text never
// reaches the rules, since the probe skips boxes of one pixel.
export const undersizedText: Rule = (snapshot) =>
  snapshot.elements.flatMap((element) => {
    if (element.text === '') return []
    const chain = [element, ...ancestorsOf(element, snapshot.elements)]
    if (chain.some((box) => SMALL_TEXT_TAGS.has(box.tag))) return []
    const functional = chain.some((box) => FUNCTIONAL_TEXT_TAGS.has(box.tag))
    const floor = functional ? MIN_UI_FONT_SIZE : MIN_BODY_FONT_SIZE
    if (element.fontSize >= floor) return []
    return [
      {
        rule: 'undersized-text',
        severity: 'warn',
        message: `${String(element.fontSize)}px text is under the ${String(floor)}px floor for ${functional ? 'controls, labels and cells' : 'running text'}; raise it or drop the text`,
        subject: element.selector,
        identity: element.signature,
      },
    ]
  })
