import type { ElementBox } from '@/model/ElementBox.js'
import { CARD_EXEMPT_TAGS } from '@/rules/CARD_EXEMPT_TAGS.js'
import { FLOATING_POSITIONS } from '@/rules/FLOATING_POSITIONS.js'
import { isLinkButton } from '@/rules/isLinkButton.js'
import { MIN_CARD_HEIGHT } from '@/rules/MIN_CARD_HEIGHT.js'

/** A control, a link button, a badge, a dialog or a popover: rounded and padded, but not a card. */
export const isCardExempt = (element: ElementBox): boolean =>
  CARD_EXEMPT_TAGS.has(element.tag) ||
  element.isControl ||
  isLinkButton(element) ||
  element.isDialog ||
  FLOATING_POSITIONS.has(element.position) ||
  element.height < MIN_CARD_HEIGHT
