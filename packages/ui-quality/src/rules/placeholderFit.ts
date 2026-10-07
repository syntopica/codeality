import { PLACEHOLDER_OVERFLOW_RATIO } from '@/rules/PLACEHOLDER_OVERFLOW_RATIO.js'
import type { Rule } from '@/rules/Rule.js'

// A placeholder wider than its field is cut mid-word with no ellipsis
// ("Buscar rosters, categ" at 390px): the hint it carries never reads.
export const placeholderFit: Rule = (snapshot) =>
  snapshot.elements
    .filter(
      (element) =>
        element.placeholderWidth > 0 &&
        element.contentWidth > 0 &&
        element.placeholderWidth >
          element.contentWidth * PLACEHOLDER_OVERFLOW_RATIO,
    )
    .map((element) => ({
      rule: 'placeholder-fit',
      severity: 'warn',
      message: `the placeholder needs ${String(Math.round(element.placeholderWidth))}px and the field shows ${String(Math.round(element.contentWidth))}px at ${String(snapshot.viewportWidth)}px; shorten it or widen the field`,
      subject: element.selector,
      identity: element.selector,
    }))
