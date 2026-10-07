import { isCardLike } from '@/rules/isCardLike.js'
import { isUserContent } from '@/rules/isUserContent.js'
import { pageBackdropOf } from '@/rules/pageBackdropOf.js'
import type { Rule } from '@/rules/Rule.js'
import { stripeSideOf } from '@/rules/stripeSideOf.js'

// A card with one thick coloured border on its left or right edge is the
// "callout" a template reaches for. The side stripe is the tell, not the
// callout, so quotations and authored content are left alone. Advisory;
// a design system that does this on purpose lists it under `disable`.
export const sideStripeAccent: Rule = (snapshot) => {
  const { elements } = snapshot
  const canvas = pageBackdropOf(snapshot.rootBackgrounds)
  return elements.flatMap((box) => {
    const side = stripeSideOf(box)
    if (!side || isUserContent(box, elements)) return []
    if (!isCardLike(box, elements, canvas)) return []
    return [
      {
        rule: 'side-stripe-accent',
        severity: 'warn',
        message: `a card with a ${side}-edge accent stripe; mark it with an icon, a heading or a tinted fill instead`,
        subject: box.selector,
        identity: box.signature,
      },
    ]
  })
}
