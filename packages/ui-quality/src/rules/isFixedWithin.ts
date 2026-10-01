import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'

/** Whether `element`, or an ancestor below `root`, is fixed in place. */
export const isFixedWithin = (
  element: ElementBox,
  root: ElementBox,
  elements: ElementBox[],
): boolean => {
  const ancestors = ancestorsOf(element, elements)
  return [element, ...ancestors.slice(0, ancestors.indexOf(root))].some(
    (node) => node.position === 'fixed',
  )
}
