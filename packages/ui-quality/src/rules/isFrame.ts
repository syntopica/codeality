import type { ElementBox } from '@/model/ElementBox.js'
import { hasVisibleBorder } from '@/rules/hasVisibleBorder.js'
import { isPainted } from '@/rules/isPainted.js'

/** A box that reads as the edge of a card, panel or region: drawn, filled, rounded, shadowed or a landmark. */
export const isFrame = (box: ElementBox): boolean =>
  box.isDialog ||
  box.isMain ||
  hasVisibleBorder(box) ||
  isPainted(box.backgroundColor) ||
  box.shadowBlur > 0 ||
  box.borderRadius > 0
