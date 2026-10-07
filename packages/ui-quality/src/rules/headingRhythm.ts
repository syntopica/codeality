import { childrenIndex } from '@/rules/childrenIndex.js'
import { HEADING_TAGS } from '@/rules/HEADING_TAGS.js'
import { headingGapsOf } from '@/rules/headingGapsOf.js'
import { isInMain } from '@/rules/isInMain.js'
import { MIN_ARRHYTHMIC_HEADINGS } from '@/rules/MIN_ARRHYTHMIC_HEADINGS.js'
import type { Rule } from '@/rules/Rule.js'

// A heading belongs to what follows it, so the space above it is larger than
// the space below. One heading that does not is a tight spot; two are a
// screen whose headings float between blocks.
export const headingRhythm: Rule = (snapshot) => {
  const { elements } = snapshot
  const children = childrenIndex(elements)
  const loose = elements.flatMap((heading) => {
    if (!HEADING_TAGS.has(heading.tag) || !isInMain(heading, elements))
      return []
    const siblings = children.get(heading.parent ?? -1) ?? []
    const gaps = headingGapsOf(heading, siblings)
    return gaps && gaps.above <= gaps.below ? [{ heading, gaps }] : []
  })
  if (loose.length < MIN_ARRHYTHMIC_HEADINGS) return []
  return loose.map(({ heading, gaps }) => ({
    rule: 'heading-rhythm',
    severity: 'warn',
    message: `${heading.tag} has ${String(gaps.above)}px above it and ${String(gaps.below)}px below; a heading sits closer to what it introduces than to what came before`,
    subject: heading.selector,
    identity: heading.signature,
  }))
}
