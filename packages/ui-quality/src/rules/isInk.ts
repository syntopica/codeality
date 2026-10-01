import type { ElementBox } from '@/model/ElementBox.js'
import { hasVisibleBorder } from '@/rules/hasVisibleBorder.js'
import { isPainted } from '@/rules/isPainted.js'
import { MEDIA_TAGS } from '@/rules/MEDIA_TAGS.js'

/** Whether the element paints anything: text, a fill, a border, a control or media. */
export const isInk = (element: ElementBox): boolean =>
  element.text !== '' ||
  element.isControl ||
  MEDIA_TAGS.has(element.tag) ||
  isPainted(element.backgroundColor) ||
  hasVisibleBorder(element)
