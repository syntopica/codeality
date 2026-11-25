import type { ElementBox } from '@/model/ElementBox.js'
import { MEDIA_TAGS } from '@/rules/MEDIA_TAGS.js'

/** Media and form controls size to their own content, so a `max-width` on them is not a column cap. */
export const isReplacedOrControl = (element: ElementBox): boolean =>
  MEDIA_TAGS.has(element.tag) ||
  element.isControl ||
  element.tag === 'button' ||
  element.tag === 'input' ||
  element.tag === 'select' ||
  element.tag === 'textarea'
