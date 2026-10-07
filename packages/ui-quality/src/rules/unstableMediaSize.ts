import type { RawFinding } from '@/model/RawFinding.js'
import { MAX_LAYOUT_SHIFT } from '@/rules/MAX_LAYOUT_SHIFT.js'
import type { Rule } from '@/rules/Rule.js'

// An image or video in the flow whose box is unknown until its file
// arrives: no width and height attributes, no aspect-ratio, no CSS height.
// Everything below it jumps when it loads. Whatever the cause, a page whose
// layout shifted by over 0.1 (cumulative layout shift) between its first
// paint and settling is reported once.
export const unstableMediaSize: Rule = (snapshot, context) => {
  const findings: RawFinding[] = snapshot.media
    .filter((media) => !media.sized)
    .map((media) => ({
      rule: 'unstable-media-size',
      severity: 'warn',
      message: `this ${media.tag} has no width and height attributes, aspect-ratio or CSS height, so the content below it shifts when it loads; give it its dimensions`,
      subject: media.selector,
      identity: media.signature,
    }))
  if (snapshot.layoutShift > MAX_LAYOUT_SHIFT)
    findings.push({
      rule: 'unstable-media-size',
      severity: 'warn',
      message: `the layout shifted by ${String(snapshot.layoutShift)} (cumulative layout shift) while the page loaded, over ${String(MAX_LAYOUT_SHIFT)}; reserve the space of media and late content before it arrives`,
      subject: context.route.main,
      identity: 'layout-shift',
    })
  return findings
}
