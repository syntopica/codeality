import type { ElementBox } from '@/model/ElementBox.js'
import { isCard } from '@/rules/isCard.js'
import { outerCardOf } from '@/rules/outerCardOf.js'
import { pageBackdropOf } from '@/rules/pageBackdropOf.js'
import type { Rule } from '@/rules/Rule.js'

// A card inside another card, within three levels: a box in a box in a box,
// each drawing its own edge. Reported once per outer card, with how many it
// holds.
export const nestedCards: Rule = (snapshot) => {
  const { elements } = snapshot
  const canvas = pageBackdropOf(snapshot.rootBackgrounds)
  const cards = new Set(
    elements
      .filter((element) => isCard(element, elements, canvas))
      .map((element) => element.id),
  )
  const inner = new Map<ElementBox, ElementBox[]>()
  for (const id of cards) {
    const card = elements[id]
    const outer = card ? outerCardOf(card, elements, cards) : null
    if (card && outer) inner.set(outer, [...(inner.get(outer) ?? []), card])
  }
  return [...inner].map(([outer, nested]) => ({
    rule: 'nested-cards',
    severity: 'warn',
    message: `this card holds ${String(nested.length)} card${nested.length === 1 ? '' : 's'} inside it (${nested[0]?.selector ?? ''}); drop the inner border, shadow or fill and separate with space or a divider`,
    subject: outer.selector,
    identity: outer.signature,
  }))
}
