import type { RawFinding } from '@/model/RawFinding.js'
import { inkEdgesOf } from '@/rules/inkEdgesOf.js'
import type { Rule } from '@/rules/Rule.js'

// The header and the content below it start a few pixels apart: a full-width
// search bar over a centred column. Large offsets are a deliberate layout (a
// centred form under a full-width bar); a near miss never is.
export const edgeMisaligned: Rule = (snapshot, context) => {
  const { tolerance, maxOffset } = context.options.edgeMisaligned
  const banner = snapshot.elements.find((element) => element.isBanner)
  const main = snapshot.elements.find((element) => element.isMain)
  if (!banner || !main) return []
  const top = inkEdgesOf(banner, snapshot.elements)
  const body = inkEdgesOf(main, snapshot.elements)
  if (!top || !body) return []
  const offsets = [
    { side: 'left', offset: Math.abs(top.left - body.left) },
    { side: 'right', offset: Math.abs(top.right - body.right) },
  ].filter(({ offset }) => offset > tolerance && offset <= maxOffset)
  if (offsets.length === 0) return []
  const finding: RawFinding = {
    rule: 'edge-misaligned',
    severity: 'warn',
    message: `header and main content edges differ by ${offsets.map(({ side, offset }) => `${String(offset)}px on the ${side}`).join(' and ')} at ${String(snapshot.viewportWidth)}px; put both on the same container`,
    subject: main.selector,
    identity: 'banner-main',
  }
  return [finding]
}
