import { isTapTarget } from '@/rules/isTapTarget.js'
import { MAX_PHONE_WIDTH } from '@/rules/MAX_PHONE_WIDTH.js'
import { overlappingTapTargets } from '@/rules/overlappingTapTargets.js'
import type { Rule } from '@/rules/Rule.js'
import { smallTapTargets } from '@/rules/smallTapTargets.js'

// At a phone width, a link, button or ARIA widget whose hit area (its box, its
// label and any absolutely positioned ::before/::after) is under 44x44px, or
// that crosses another target. The width is the screen's, not the page's:
// without a viewport meta tag a phone lays the page out at 980px. Complements axe's 24px `target-size`, which
// the HIG and Material both exceed. Links inside a sentence are exempt.
export const touchTarget: Rule = (snapshot) => {
  if (snapshot.screen.viewport.width > MAX_PHONE_WIDTH) return []
  const { elements } = snapshot
  const targets = elements.filter((element) => isTapTarget(element, elements))
  return [
    ...smallTapTargets(targets),
    ...overlappingTapTargets(targets, elements),
  ]
}
