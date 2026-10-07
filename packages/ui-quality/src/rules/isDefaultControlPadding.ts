import type { ElementBox } from '@/model/ElementBox.js'

/** A native button that still has the browser's own `1px 6px` padding, which nobody chose. */
export const isDefaultControlPadding = (element: ElementBox): boolean =>
  element.tag === 'button' &&
  element.padding[0] === 1 &&
  element.padding[1] === 6 &&
  element.padding[2] === 1 &&
  element.padding[3] === 6
