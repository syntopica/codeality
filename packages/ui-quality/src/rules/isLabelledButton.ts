import type { ElementBox } from '@/model/ElementBox.js'

/** A button that names its action in words. */
export const isLabelledButton = (element: ElementBox): boolean =>
  (element.tag === 'button' || element.role === 'button') && element.text !== ''
