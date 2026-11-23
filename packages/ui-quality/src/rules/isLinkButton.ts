import type { ElementBox } from '@/model/ElementBox.js'
import { MAX_LINK_BUTTON_HEIGHT } from '@/rules/MAX_LINK_BUTTON_HEIGHT.js'

/** A link drawn as a button: tappable, laid out inline and no taller than a button. */
export const isLinkButton = (element: ElementBox): boolean =>
  element.tappable &&
  element.display.startsWith('inline') &&
  element.height <= MAX_LINK_BUTTON_HEIGHT
