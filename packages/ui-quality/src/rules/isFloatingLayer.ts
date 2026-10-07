import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { FLOATING_POSITIONS } from '@/rules/FLOATING_POSITIONS.js'

/**
 * A dialog, popover or menu: positioned out of flow, or inside something that
 * is. Over content of the same colour, its border and shadow both earn their
 * place.
 */
export const isFloatingLayer = (
  element: ElementBox,
  elements: ElementBox[],
): boolean =>
  element.isDialog ||
  [element, ...ancestorsOf(element, elements)].some((box) =>
    FLOATING_POSITIONS.has(box.position),
  )
