import type { ElementBox } from '@/model/ElementBox.js'
import { descendantsOf } from '@/rules/descendantsOf.js'

/**
 * How the one icon an item draws is painted (`fill`, `stroke`), or empty
 * when it draws none or several: a section holding many icons is not an item.
 */
export const soleIconPaint = (
  item: ElementBox,
  elements: ElementBox[],
): string => {
  const icons = [item, ...descendantsOf(item, elements)].filter(
    (element) => element.svgDigest !== '',
  )
  return icons.length === 1 ? (icons[0]?.svgPaint ?? '') : ''
}
