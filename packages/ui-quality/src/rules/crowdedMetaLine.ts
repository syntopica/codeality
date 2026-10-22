import { childrenIndex } from '@/rules/childrenIndex.js'
import { crowdedRowOf } from '@/rules/crowdedRowOf.js'
import { hasEllipsizedText } from '@/rules/hasEllipsizedText.js'
import { MIN_VISIBLE_CHARS } from '@/rules/MIN_VISIBLE_CHARS.js'
import type { Rule } from '@/rules/Rule.js'
import { visibleCharsOf } from '@/rules/visibleCharsOf.js'

// "23/09/2026 [Tarjetas] Caix… -1.355,55 €": a line of three or more items
// where one of them is truncated with an ellipsis to a stub. text-clipped
// leaves an ellipsis alone, since it tells the reader something is cut; a
// name cut to a few letters still cannot be read.
export const crowdedMetaLine: Rule = (snapshot) => {
  const children = childrenIndex(snapshot.elements)
  return snapshot.elements.flatMap((element) => {
    if (element.text === '' || !hasEllipsizedText(element)) return []
    const visible = visibleCharsOf(element)
    if (visible >= MIN_VISIBLE_CHARS) return []
    const row = crowdedRowOf(element, snapshot.elements, children)
    if (!row) return []
    return [
      {
        rule: 'crowded-meta-line',
        severity: 'error',
        message: `"${element.text}" shows about ${String(visible)} of its ${String(element.textLength)} characters before the ellipsis, squeezed by the items sharing its line in ${row.selector}; give it a line of its own or drop an item`,
        subject: element.selector,
        identity: element.signature,
      },
    ]
  })
}
