import type { ElementBox } from '@/model/ElementBox.js'
import type { Rgba } from '@/model/Rgba.js'
import { hasDataLayout } from '@/rules/hasDataLayout.js'
import { holdsContentSurface } from '@/rules/holdsContentSurface.js'

/** The main region lays out sections or data, not running text alone: a card-like surface or a data layout. */
export const isLaidOutPage = (
  main: ElementBox,
  elements: ElementBox[],
  canvas: Rgba,
): boolean =>
  hasDataLayout(main, elements) || holdsContentSurface(main, elements, canvas)
