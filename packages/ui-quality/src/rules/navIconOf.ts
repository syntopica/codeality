import type { ElementBox } from '@/model/ElementBox.js'
import { descendantsOf } from '@/rules/descendantsOf.js'

/**
 * The icon an entry leads with: the first svg drawn in the left half of the
 * entry, or null when it draws none there. A trailing svg is a state the entry
 * is in (approved, stale, a chevron), not what tells entries apart: a plan
 * rail whose approved sections all end in the same check is not a nav reusing
 * an icon (verticagtm, 2026-10).
 */
export const navIconOf = (
  item: ElementBox,
  elements: ElementBox[],
): ElementBox | null =>
  descendantsOf(item, elements).find(
    (element) =>
      element.svgDigest !== '' &&
      element.x + element.width / 2 < item.x + item.width / 2,
  ) ?? null
