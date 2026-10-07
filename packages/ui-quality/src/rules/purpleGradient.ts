import { isPurple } from '@/rules/isPurple.js'
import { PURPLE_MIN_SURFACE_SHARE } from '@/rules/PURPLE_MIN_SURFACE_SHARE.js'
import type { Rule } from '@/rules/Rule.js'

// The violet-to-blue gradient across a hero is the default look of a
// generated page. A big surface (over a fifth of the viewport) whose gradient
// has a saturated purple stop is reported, unless the project's own palette
// is purple, in which case it is the brand and not the default.
export const purpleGradient: Rule = (snapshot, context) => {
  if (context.palette?.some(({ rgba }) => isPurple(rgba))) return []
  const viewport = snapshot.viewportWidth * snapshot.viewportHeight
  return snapshot.elements.flatMap((surface) => {
    if (
      surface.width * surface.height <= viewport * PURPLE_MIN_SURFACE_SHARE ||
      !surface.gradientStops.some(isPurple)
    )
      return []
    return [
      {
        rule: 'purple-gradient',
        severity: 'warn',
        message:
          'a large surface is painted with a purple gradient, the look of an unstyled template; take the colours from the product palette',
        subject: surface.selector,
        identity: surface.signature,
      },
    ]
  })
}
