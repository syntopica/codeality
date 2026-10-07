import { GHOST_SHADOW_BLUR } from '@/rules/GHOST_SHADOW_BLUR.js'
import { hasFullBorder } from '@/rules/hasFullBorder.js'
import { isFloatingLayer } from '@/rules/isFloatingLayer.js'
import type { Rule } from '@/rules/Rule.js'

// A box in the page flow drawn with both a border and a real shadow: two
// edges for one surface. shadcn's resting `border` + `shadow-sm` is left
// alone, and so is any floating layer. One finding per kind of element.
export const ghostElevation: Rule = (snapshot) => {
  const seen = new Set<string>()
  return snapshot.elements
    .filter((element) => {
      if (element.shadowBlur <= GHOST_SHADOW_BLUR) return false
      if (!hasFullBorder(element) || seen.has(element.signature)) return false
      if (isFloatingLayer(element, snapshot.elements)) return false
      seen.add(element.signature)
      return true
    })
    .map((element) => ({
      rule: 'ghost-elevation',
      severity: 'warn',
      message: `a ${String(element.shadowBlur)}px shadow on a bordered box draws its edge twice; keep the border or the shadow (up to shadow-sm, ${String(GHOST_SHADOW_BLUR)}px, is not reported)`,
      subject: element.selector,
      identity: element.signature,
    }))
}
