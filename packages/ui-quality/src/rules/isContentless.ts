import type { ElementBox } from '@/model/ElementBox.js'
import { MEDIA_TAGS } from '@/rules/MEDIA_TAGS.js'

/** Ink that carries nothing to read, operate or look at: a fill or a rule. */
export const isContentless = (element: ElementBox): boolean =>
  element.text === '' && !element.isControl && !MEDIA_TAGS.has(element.tag)
