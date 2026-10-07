import type { ElementBox } from '@/model/ElementBox.js'
import { descendantsOf } from '@/rules/descendantsOf.js'

/** What an item says: its `aria-label`, else its own and its descendants' text. */
export const itemNameOf = (item: ElementBox, elements: ElementBox[]): string =>
  item.label ||
  [item, ...descendantsOf(item, elements)]
    .map((element) => element.text)
    .filter(Boolean)
    .join(' ')
    .trim()
