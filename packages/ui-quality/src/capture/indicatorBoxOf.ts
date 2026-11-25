import type { CDPSession } from 'playwright'

import type { CdpBoxModel } from '@/capture/CdpBoxModel.js'
import type { CdpComputedStyle } from '@/capture/CdpComputedStyle.js'
import { computedValueOf } from '@/capture/computedValueOf.js'
import type { MarkedIndicator } from '@/capture/MarkedIndicator.js'
import type { ScrollOffset } from '@/capture/ScrollOffset.js'
import type { InputIcon } from '@/model/InputIcon.js'

/**
 * The painted box of a picker icon, in document px. Pseudo-element geometry
 * is not in getBoundingClientRect and getComputedStyle(el, '::-webkit-...')
 * answers with the input's own style, so the box is read from the shadow
 * element through DevTools. A hidden icon (an author's `opacity: 0` over a
 * custom one) reads as null.
 */
export const indicatorBoxOf = async (
  session: CDPSession,
  { element, side, nodeId }: MarkedIndicator,
  scroll: ScrollOffset,
): Promise<InputIcon | null> => {
  const style = (await session.send('CSS.getComputedStyleForNode', {
    nodeId,
  })) as CdpComputedStyle
  if (
    computedValueOf(style, 'opacity') === '0' ||
    computedValueOf(style, 'visibility') === 'hidden'
  )
    return null
  const { model } = (await session.send('DOM.getBoxModel', {
    nodeId,
  })) as CdpBoxModel
  const [left = 0, top = 0, right = 0, , , bottom = 0] = model.border
  return {
    element,
    side,
    x: left + scroll.x,
    y: top + scroll.y,
    width: right - left,
    height: bottom - top,
  }
}
