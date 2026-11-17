import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'

/** Whether `element` or any ancestor is fixed: it stays put while the page scrolls under it. */
export const isPinnedToWindow = (
  element: ElementBox,
  elements: ElementBox[],
): boolean =>
  [element, ...ancestorsOf(element, elements)].some(
    (node) => node.position === 'fixed',
  )
