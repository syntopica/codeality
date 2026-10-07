import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { NESTED_CARD_LEVELS } from '@/rules/NESTED_CARD_LEVELS.js'

/** The nearest card among the element's first three visible ancestors. */
export const outerCardOf = (
  element: ElementBox,
  elements: ElementBox[],
  cards: Set<number>,
): ElementBox | null =>
  ancestorsOf(element, elements)
    .slice(0, NESTED_CARD_LEVELS)
    .find((ancestor) => cards.has(ancestor.id)) ?? null
