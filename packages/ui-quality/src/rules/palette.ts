import { rgbaToHex } from '@/color/rgbaToHex.js'
import type { RawFinding } from '@/model/RawFinding.js'
import { nearestColor } from '@/rules/nearestColor.js'
import { paintedColors } from '@/rules/paintedColors.js'
import type { Rule } from '@/rules/Rule.js'

// A visible colour farther than `maxDeltaE` from every palette entry: the
// default-Tailwind blue badge in a pink product.
export const palette: Rule = (snapshot, context) => {
  if (!context.palette || context.palette.length === 0) return []
  const { maxDeltaE } = context.options.palette
  const findings: RawFinding[] = []
  for (const element of snapshot.elements) {
    for (const { kind, color } of paintedColors(element)) {
      const nearest = nearestColor(color, context.palette)
      if (!nearest || nearest.distance <= maxDeltaE) continue
      const hex = rgbaToHex(color)
      findings.push({
        rule: 'palette',
        severity: 'warn',
        message: `${kind} ${hex} is not in the palette (nearest ${rgbaToHex(nearest.rgba)}, deltaE ${nearest.distance.toFixed(1)})`,
        subject: element.selector,
        identity: `${kind}:${hex}`,
      })
    }
  }
  return findings
}
