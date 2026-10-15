import type { ElementBox } from '@/model/ElementBox.js'
import { hasVisibleBorder } from '@/rules/hasVisibleBorder.js'
import { isPainted } from '@/rules/isPainted.js'
import { TOGGLE_ROLES } from '@/rules/TOGGLE_ROLES.js'

/**
 * A field, select or button the eye sees as a box: drawn with a border or a
 * fill, and on the page. Links, checkboxes, radios, switches, tabs and ghost
 * buttons with nothing painted are not boxes.
 */
export const isBoxedControl = (element: ElementBox): boolean =>
  (element.isControl ||
    (element.tag === 'button' && !TOGGLE_ROLES.has(element.role)) ||
    element.role === 'button' ||
    element.role === 'combobox') &&
  (hasVisibleBorder(element) ||
    isPainted(element.backgroundColor) ||
    element.hasBackgroundImage) &&
  element.x + element.width > 0 &&
  element.y + element.height > 0
