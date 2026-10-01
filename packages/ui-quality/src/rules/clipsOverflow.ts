import type { ElementBox } from '@/model/ElementBox.js'

export const clipsOverflow = (element: ElementBox): boolean =>
  element.overflowX === 'hidden' || element.overflowX === 'clip'
