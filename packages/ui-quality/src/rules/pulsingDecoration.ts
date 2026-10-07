import { MAX_DOT_SIZE } from '@/rules/MAX_DOT_SIZE.js'
import type { Rule } from '@/rules/Rule.js'

// A small dot that breathes for ever (opacity, or a scale) is the "live"
// indicator of a generated dashboard. It is read with motion not reduced,
// since a page that respects the setting stops it. A real status indicator
// that needs it can be kept with `disable`. Advisory.
export const pulsingDecoration: Rule = (snapshot) =>
  snapshot.freeAnimations
    .filter(
      (animation) =>
        animation.infinite &&
        animation.width < MAX_DOT_SIZE &&
        animation.height < MAX_DOT_SIZE &&
        (animation.scales || animation.properties.includes('opacity')),
    )
    .map((animation) => ({
      rule: 'pulsing-decoration',
      severity: 'warn',
      message: `a ${String(animation.width)}x${String(animation.height)}px element pulses for ever; a still dot says the same`,
      subject: animation.selector,
      identity: animation.signature,
    }))
