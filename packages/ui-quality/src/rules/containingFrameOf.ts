import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { isFrame } from '@/rules/isFrame.js'

/** The nearest ancestor whose edge a reader sees: one that clips or scrolls, or a drawn card or panel. */
export const containingFrameOf = (
  element: ElementBox,
  elements: ElementBox[],
): ElementBox | null =>
  ancestorsOf(element, elements).find(
    (box) => box.overflowX !== 'visible' || isFrame(box),
  ) ?? null
