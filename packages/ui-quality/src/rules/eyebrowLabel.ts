import { childrenIndex } from '@/rules/childrenIndex.js'
import { EYEBROW_HEADING_RATIO } from '@/rules/EYEBROW_HEADING_RATIO.js'
import { EYEBROW_HEADINGS } from '@/rules/EYEBROW_HEADINGS.js'
import { isEyebrow } from '@/rules/isEyebrow.js'
import type { Rule } from '@/rules/Rule.js'

// A small spaced-out line of capitals above a big heading ("FEATURES",
// "WHY US") is the eyebrow every template puts over its hero. Advisory.
export const eyebrowLabel: Rule = (snapshot) => {
  const children = childrenIndex(snapshot.elements)
  return snapshot.elements.flatMap((label) => {
    if (!isEyebrow(label) || label.parent === null) return []
    const siblings = children.get(label.parent) ?? []
    const next = siblings[siblings.findIndex((box) => box.id === label.id) + 1]
    if (
      !next ||
      !EYEBROW_HEADINGS.has(next.tag) ||
      next.fontSize < label.fontSize * EYEBROW_HEADING_RATIO
    )
      return []
    return [
      {
        rule: 'eyebrow-label',
        severity: 'warn',
        message: `"${label.text}" is a small capitalised label over a ${next.tag}; let the heading stand alone`,
        subject: label.selector,
        identity: label.signature,
      },
    ]
  })
}
