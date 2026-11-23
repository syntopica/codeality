import type { RawFinding } from '@/model/RawFinding.js'
import { alignmentEdgesOf } from '@/rules/alignmentEdgesOf.js'
import { railSidesOf } from '@/rules/railSidesOf.js'
import type { Rule } from '@/rules/Rule.js'

// The header and the content below it start a few pixels apart: a full-width
// search bar over a centred column. Large offsets are a deliberate layout (a
// centred form under a full-width bar); a near miss never is. A side taken by
// a fixed sidebar is not compared: the header spans the sidebar too.
export const edgeMisaligned: Rule = (snapshot, context) => {
  const { tolerance, maxOffset } = context.options.edgeMisaligned
  const banner = snapshot.elements.find((element) => element.isBanner)
  const main = snapshot.elements.find((element) => element.isMain)
  if (!banner || !main) return []
  const top = alignmentEdgesOf(banner, snapshot.elements)
  const body = alignmentEdgesOf(main, snapshot.elements)
  if (!top || !body) return []
  const rails = railSidesOf(main, snapshot)
  const offsets = [
    { side: 'left', offset: Math.abs(top.left - body.left) },
    { side: 'right', offset: Math.abs(top.right - body.right) },
  ].filter(
    ({ side, offset }) =>
      offset > tolerance && offset <= maxOffset && !rails.has(side),
  )
  if (offsets.length === 0) return []
  const finding: RawFinding = {
    rule: 'edge-misaligned',
    severity: 'error',
    message: `header and main content edges differ by ${offsets.map(({ side, offset }) => `${String(offset)}px on the ${side}`).join(' and ')} at ${String(snapshot.viewportWidth)}px; put both on the same container`,
    subject: main.selector,
    identity: 'banner-main',
  }
  return [finding]
}
