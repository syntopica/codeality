import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'

/** A header cell, or anything it sits in, is `position: sticky`. */
export const isStickyHeader = (
  cell: ElementBox,
  elements: ElementBox[],
): boolean =>
  [cell, ...ancestorsOf(cell, elements)].some(
    (box) => box.position === 'sticky',
  )
