import type { ElementBox } from '@/model/ElementBox.js'

/** A flex container that wraps: its children are chips laid out in lines, not rows. */
export const wrapsChildren = (element: ElementBox | undefined): boolean =>
  element?.flexWrap === 'wrap' || element?.flexWrap === 'wrap-reverse'
