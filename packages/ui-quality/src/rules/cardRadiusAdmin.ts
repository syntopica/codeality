import { isCard } from '@/rules/isCard.js'
import { MAX_CARD_RADIUS } from '@/rules/MAX_CARD_RADIUS.js'
import { pageBackdropOf } from '@/rules/pageBackdropOf.js'
import type { Rule } from '@/rules/Rule.js'

// Opt-in, through `register: "product"`: a working UI keeps its cards to 8px
// of corner radius or less. A brand surface chooses its own, so without the
// setting nothing is reported.
export const cardRadiusAdmin: Rule = (snapshot, context) => {
  if (context.register !== 'product') return []
  const { elements } = snapshot
  const canvas = pageBackdropOf(snapshot.rootBackgrounds)
  return elements
    .filter(
      (element) =>
        element.borderRadius > MAX_CARD_RADIUS &&
        isCard(element, elements, canvas),
    )
    .map((card) => ({
      rule: 'card-radius-admin',
      severity: 'warn',
      message: `this card has a ${String(Math.round(card.borderRadius))}px corner radius; a product UI keeps cards to ${String(MAX_CARD_RADIUS)}px or less`,
      subject: card.selector,
      identity: card.signature,
    }))
}
