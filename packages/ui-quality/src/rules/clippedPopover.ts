import { clippingAncestorsOf } from '@/rules/clippingAncestorsOf.js'
import { isCutBy } from '@/rules/isCutBy.js'
import { POPOVER_ROLES } from '@/rules/POPOVER_ROLES.js'
import type { Rule } from '@/rules/Rule.js'

// A menu, a list of options or a tooltip positioned absolutely inside a box
// with `overflow: hidden` or `clip` is cut off at that box's edge. Only what
// is open when the page settles is seen, and only the roles that name a
// popover are judged, so a clipped decoration is not mistaken for one.
export const clippedPopover: Rule = (snapshot) =>
  snapshot.elements.flatMap((layer) => {
    if (layer.position !== 'absolute' || !POPOVER_ROLES.has(layer.role))
      return []
    const clip = clippingAncestorsOf(layer, snapshot.elements).find(
      (ancestor) => isCutBy(layer, ancestor),
    )
    if (!clip) return []
    return [
      {
        rule: 'clipped-popover',
        severity: 'warn',
        message: `a ${layer.role} extends past ${clip.selector}, which clips it (overflow ${clip.overflowX === 'visible' ? clip.overflowY : clip.overflowX}); render it outside that box or let it overflow`,
        subject: layer.selector,
        identity: layer.signature,
      },
    ]
  })
