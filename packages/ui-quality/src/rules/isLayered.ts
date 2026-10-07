import type { ElementBox } from '@/model/ElementBox.js'
import { FLEX_OR_GRID } from '@/rules/FLEX_OR_GRID.js'

/** Whether `z-index` applies to the element: it is positioned, or a flex or grid item. */
export const isLayered = (
  element: ElementBox,
  elements: ElementBox[],
): boolean => {
  if (element.position !== 'static') return true
  const parent = element.parent === null ? undefined : elements[element.parent]
  return parent !== undefined && FLEX_OR_GRID.test(parent.display)
}
