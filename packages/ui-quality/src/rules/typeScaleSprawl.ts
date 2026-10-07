import type { RawFinding } from '@/model/RawFinding.js'
import { MAX_TYPE_SIZES } from '@/rules/MAX_TYPE_SIZES.js'
import { nearSizesOf } from '@/rules/nearSizesOf.js'
import { roundedFontSize } from '@/rules/roundedFontSize.js'
import type { Rule } from '@/rules/Rule.js'
import { scaleTextsOf } from '@/rules/scaleTextsOf.js'

// The main region's own text set in more than six sizes, or in two sizes 1px
// or less apart side by side (13px beside 14px): a scale nobody chose.
// Articles, rich-text bodies and editors are authored content and are left out.
export const typeScaleSprawl: Rule = (snapshot) => {
  const { elements } = snapshot
  const texts = scaleTextsOf(elements)
  const main = elements.find((element) => element.isMain)
  if (!main || texts.length === 0) return []
  const findings: RawFinding[] = []
  const sizes = [...new Set(texts.map(roundedFontSize))].toSorted(
    (a, b) => a - b,
  )
  if (sizes.length > MAX_TYPE_SIZES)
    findings.push({
      rule: 'type-scale-sprawl',
      severity: 'warn',
      message: `the main region uses ${String(sizes.length)} font sizes (${sizes.map((size) => `${String(size)}px`).join(', ')}), over ${String(MAX_TYPE_SIZES)}; settle on a smaller scale`,
      subject: main.selector,
      identity: 'size-count',
    })
  for (const {
    parent,
    sizes: [low, high],
  } of nearSizesOf(texts))
    findings.push({
      rule: 'type-scale-sprawl',
      severity: 'warn',
      message: `${String(low)}px and ${String(high)}px text side by side are too close to read as two steps; use one size, or two that differ clearly`,
      subject: elements[parent]?.selector ?? main.selector,
      identity: 'near-sizes',
    })
  return findings
}
