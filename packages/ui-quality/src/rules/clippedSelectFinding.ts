import type { ElementBox } from '@/model/ElementBox.js'
import type { RawFinding } from '@/model/RawFinding.js'

/**
 * A select whose content box is shorter than one line of its font: Chromium
 * clips the chosen option to that box, so its descenders (or its whole top)
 * are cut while the scroll sizes say nothing overflowed.
 */
export const clippedSelectFinding = (
  element: ElementBox,
): RawFinding | null => {
  if (element.lineBoxHeight === 0) return null
  const short = element.lineBoxHeight - element.contentHeight
  if (short <= 1) return null
  return {
    rule: 'text-clipped',
    severity: 'error',
    message: `the select's text is cut: its ${String(Math.round(element.contentHeight))}px content box is ${String(Math.round(short))}px shorter than one ${String(Math.round(element.lineBoxHeight))}px line of its font; lower the vertical padding or raise the height`,
    subject: element.selector,
    identity: element.selector,
  }
}
