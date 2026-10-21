import type { ElementBox } from '@/model/ElementBox.js'

/** Tables, buttons and tabs may size to content rather than the column. */
export const hasContentSizedWidth = (element: ElementBox): boolean =>
  element.display === 'table' ||
  element.tag === 'button' ||
  element.role === 'button' ||
  element.role === 'tab'
