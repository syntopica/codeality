import { inkEdgesOf } from '@/rules/inkEdgesOf.js'
import type { Rule } from '@/rules/Rule.js'

// The ink inside the main region against the width the region offers. A
// `max-w-6xl` list centred in a 1660px workspace leaves a quarter of a wide
// screen empty; on a data page that is space the table could have used.
export const contentWidth: Rule = (snapshot, context) => {
  const { minRatio, minViewport } = context.options.contentWidth
  if (snapshot.viewportWidth < minViewport) return []
  const main = snapshot.elements.find((element) => element.isMain)
  if (!main || main.width === 0) return []
  const edges = inkEdgesOf(main, snapshot.elements)
  if (!edges) return []
  const span = edges.right - edges.left
  const ratio = span / main.width
  if (ratio >= minRatio) return []
  return [
    {
      rule: 'content-width',
      severity: 'warn',
      message: `content spans ${String(span)}px of the ${String(main.width)}px main region (${String(Math.round(ratio * 100))}%, minimum ${String(Math.round(minRatio * 100))}%) at ${String(snapshot.viewportWidth)}px`,
      subject: main.selector,
      identity: 'main',
    },
  ]
}
