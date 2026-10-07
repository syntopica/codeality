import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'

/**
 * A link set in a line of text: WCAG exempts it from target size, since its
 * height is the line's. Inline in a paragraph, or beside text of its parent's.
 */
export const isInlineLink = (
  element: ElementBox,
  elements: ElementBox[],
): boolean => {
  if (element.tag !== 'a' || element.display !== 'inline') return false
  const parent = element.parent === null ? null : elements[element.parent]
  return (
    (parent?.text ?? '') !== '' ||
    ancestorsOf(element, elements).some((box) => box.tag === 'p')
  )
}
