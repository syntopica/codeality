import type { ElementBox } from '@/model/ElementBox.js'

/** Takes part in the normal flow: not absolutely positioned or fixed. */
export const isInFlow = (element: ElementBox): boolean =>
  element.position !== 'absolute' && element.position !== 'fixed'
