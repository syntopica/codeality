import type { ElementBox } from '@/model/ElementBox.js'
import { isLineClamped } from '@/rules/isLineClamped.js'

/** Horizontal ellipsis or a line clamp is actively shortening this text. */
export const hasEllipsizedText = (element: ElementBox): boolean =>
  isLineClamped(element) ||
  (element.textOverflow === 'ellipsis' &&
    element.scrollWidth > element.clientWidth + 1)
