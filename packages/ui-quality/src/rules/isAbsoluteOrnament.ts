import type { ElementBox } from '@/model/ElementBox.js'
import { isContentless } from '@/rules/isContentless.js'

/**
 * A fill taken out of the flow to decorate, such as a blurred circle pushed
 * past a card's corner. It overhangs the content on purpose.
 */
export const isAbsoluteOrnament = (element: ElementBox): boolean =>
  element.position === 'absolute' && isContentless(element)
