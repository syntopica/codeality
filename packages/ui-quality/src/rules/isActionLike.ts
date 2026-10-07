import type { ElementBox } from '@/model/ElementBox.js'
import { ACTION_TAGS } from '@/rules/ACTION_TAGS.js'

/** A link, a button, or an input drawn as a button (submit, reset). */
export const isActionLike = (element: ElementBox): boolean =>
  ACTION_TAGS.has(element.tag) ||
  (element.tag === 'input' && element.isControl && !element.isTextEntry)
