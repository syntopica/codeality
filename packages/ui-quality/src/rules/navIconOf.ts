import type { ElementBox } from '@/model/ElementBox.js'
import { descendantsOf } from '@/rules/descendantsOf.js'

/** The first svg drawn inside an element, or null when it draws none. */
export const navIconOf = (
  item: ElementBox,
  elements: ElementBox[],
): ElementBox | null =>
  descendantsOf(item, elements).find((element) => element.svgDigest !== '') ??
  null
