import type { ElementBox } from '@/model/ElementBox.js'
import type { InkEdges } from '@/rules/InkEdges.js'
import { sidePanelsOf } from '@/rules/sidePanelsOf.js'

/** The span of the screen left to the main region: the viewport less the side panels beside it. */
export const regionEdgesOf = (
  main: ElementBox,
  elements: ElementBox[],
  viewportWidth: number,
): InkEdges =>
  sidePanelsOf(main, elements).reduce<InkEdges>(
    (edges, panel) =>
      panel.x + panel.width <= main.x
        ? { ...edges, left: Math.max(edges.left, panel.x + panel.width) }
        : { ...edges, right: Math.min(edges.right, panel.x) },
    { left: 0, right: viewportWidth },
  )
