import type { Rule } from '@/rules/Rule.js'

// `transition: all` animates every property that changes, layout included:
// a width or a padding eases in over the duration, and the browser cannot
// keep the animation on the compositor. One finding per kind of element.
export const transitionAll: Rule = (snapshot) => {
  const seen = new Set<string>()
  return snapshot.elements
    .filter((element) => {
      if (!element.transitionAll || seen.has(element.signature)) return false
      seen.add(element.signature)
      return true
    })
    .map((element) => ({
      rule: 'transition-all',
      severity: 'warn',
      message:
        'transition-property is all, so every property change animates, layout included; name the properties that should move (colors, opacity, transform)',
      subject: element.selector,
      identity: element.signature,
    }))
}
