import type { ElementBox } from '@/model/ElementBox.js'
import { descendantsOf } from '@/rules/descendantsOf.js'
import { MAX_ICON_SIDE } from '@/rules/MAX_ICON_SIDE.js'

/**
 * How the one icon an item draws is painted (`fill`, `stroke`), or empty
 * when it draws none or several: a section holding many icons is not an item.
 * An svg larger than a glyph is a drawing (a chart, an illustration), not an icon.
 */
export const soleIconPaint = (
  item: ElementBox,
  elements: ElementBox[],
): string => {
  const icons = [item, ...descendantsOf(item, elements)].filter(
    (element) =>
      element.svgDigest !== '' &&
      Math.max(element.width, element.height) <= MAX_ICON_SIDE,
  )
  return icons.length === 1 ? (icons[0]?.svgPaint ?? '') : ''
}
