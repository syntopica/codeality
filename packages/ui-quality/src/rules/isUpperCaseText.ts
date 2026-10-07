import type { ElementBox } from '@/model/ElementBox.js'

/** Text shown in capitals, by `text-transform` or as written. */
export const isUpperCaseText = (element: ElementBox): boolean =>
  element.textTransform === 'uppercase' ||
  (element.text !== element.text.toLowerCase() &&
    element.text === element.text.toUpperCase())
