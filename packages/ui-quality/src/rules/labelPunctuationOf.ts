import type { ElementBox } from '@/model/ElementBox.js'
import { LABEL_TAGS } from '@/rules/LABEL_TAGS.js'

/** What a label or legend does that the guidance forbids: ends in a colon, or marks the field required with an asterisk. */
export const labelPunctuationOf = (
  element: ElementBox,
  elements: ElementBox[],
): string | null => {
  const parent = element.parent === null ? undefined : elements[element.parent]
  const marker =
    element.text === '*' && parent !== undefined && LABEL_TAGS.has(parent.tag)
  if (marker) return 'an asterisk marking the field as required'
  if (!LABEL_TAGS.has(element.tag)) return null
  if (element.textTail.endsWith(':')) return 'a trailing colon'
  return element.text.includes('*')
    ? 'an asterisk marking the field as required'
    : null
}
