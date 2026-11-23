import { NATIVE_CARET_GAP } from '@/rules/NATIVE_CARET_GAP.js'
import type { Rule } from '@/rules/Rule.js'

// A native select keeps its arrow about 2px inside the border whatever its
// padding-right, so once its text is inset (`px-3`) the caret sits flush
// against the edge the text keeps clear of. An unpadded select looks native
// and is left alone.
export const crampedSelectCaret: Rule = (snapshot) =>
  snapshot.elements
    .filter(
      (element) =>
        element.nativeCaret === true && element.padding[3] > NATIVE_CARET_GAP,
    )
    .map((element) => ({
      rule: 'cramped-select-caret',
      severity: 'error',
      message: `the select insets its text ${String(Math.round(element.padding[3]))}px while the browser draws its arrow against the right border; set appearance: none and draw a chevron with at least 1.25rem of right padding`,
      subject: element.selector,
      identity: element.selector,
    }))
