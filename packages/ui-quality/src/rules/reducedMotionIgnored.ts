import { ignoresReducedMotion } from '@/rules/ignoresReducedMotion.js'
import type { Rule } from '@/rules/Rule.js'

// The screens are captured with `prefers-reduced-motion: reduce`, so an
// animation still running when the probe reads `document.getAnimations()`
// belongs to a page that ignores the setting (WCAG 2.3.3): anything that
// moves, and an opacity loop longer than a second. CSS transitions end on
// their own and are not counted.
export const reducedMotionIgnored: Rule = (snapshot) =>
  snapshot.animations.filter(ignoresReducedMotion).map((animation) => ({
    rule: 'reduced-motion-ignored',
    severity: 'warn',
    message: `${animation.infinite ? 'an endless' : 'a running'} ${animation.properties.join('/')} animation keeps going with reduced motion on; switch it off under prefers-reduced-motion`,
    subject: animation.selector,
    identity: animation.signature,
  }))
