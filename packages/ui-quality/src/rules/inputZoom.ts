import type { RawFinding } from '@/model/RawFinding.js'
import { MIN_INPUT_FONT_SIZE } from '@/rules/MIN_INPUT_FONT_SIZE.js'
import type { Rule } from '@/rules/Rule.js'
import { TOUCH_MAX_VIEWPORT } from '@/rules/TOUCH_MAX_VIEWPORT.js'

// A field whose text is under 16px makes iOS Safari zoom the whole page when
// it is focused, and the page stays zoomed after the keyboard closes: the
// layout that measured clean at 390px is then seen cut off on the right.
export const inputZoom: Rule = (snapshot) => {
  if (snapshot.viewportWidth >= TOUCH_MAX_VIEWPORT) return []
  const small = snapshot.elements.filter(
    (element) => element.isTextEntry && element.fontSize < MIN_INPUT_FONT_SIZE,
  )
  const first = small[0]
  if (!first) return []
  const finding: RawFinding = {
    rule: 'input-zoom',
    severity: 'error',
    message: `${String(small.length)} field${small.length === 1 ? '' : 's'} set text under ${String(MIN_INPUT_FONT_SIZE)}px (${String(first.fontSize)}px on ${first.selector}); iOS Safari zooms the page when one is focused. Use 16px below the tablet breakpoint`,
    subject: first.selector,
    identity: 'input-zoom',
  }
  return [finding]
}
