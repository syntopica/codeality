import { descendantsOf } from '@/rules/descendantsOf.js'
import { isInk } from '@/rules/isInk.js'
import type { Rule } from '@/rules/Rule.js'

// The ink inside the main region against the width the region offers. A
// `max-w-6xl` list centred in a 1660px workspace leaves a quarter of a wide
// screen empty; on a data page that is space the table could have used.
export const contentWidth: Rule = (snapshot, context) => {
  const { minRatio, minViewport } = context.options.contentWidth
  if (snapshot.viewportWidth < minViewport) return []
  const main = snapshot.elements.find((element) => element.isMain)
  if (!main || main.width === 0) return []
  const ink = descendantsOf(main, snapshot.elements).filter(isInk)
  if (ink.length === 0) return []
  const left = Math.min(...ink.map((element) => element.x))
  const right = Math.max(...ink.map((element) => element.x + element.width))
  const ratio = (right - left) / main.width
  if (ratio >= minRatio) return []
  return [
    {
      rule: 'content-width',
      severity: 'warn',
      message: `content spans ${String(right - left)}px of the ${String(main.width)}px main region (${String(Math.round(ratio * 100))}%, minimum ${String(Math.round(minRatio * 100))}%) at ${String(snapshot.viewportWidth)}px`,
      subject: main.selector,
      identity: 'main',
    },
  ]
}
