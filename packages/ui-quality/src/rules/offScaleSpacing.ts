import { isInMain } from '@/rules/isInMain.js'
import { isOffScaleSpacing } from '@/rules/isOffScaleSpacing.js'
import { isUserContent } from '@/rules/isUserContent.js'
import { MIN_OFF_SCALE_VALUES } from '@/rules/MIN_OFF_SCALE_VALUES.js'
import type { Rule } from '@/rules/Rule.js'
import { SPACING_STEP } from '@/rules/SPACING_STEP.js'
import { spacingValuesOf } from '@/rules/spacingValuesOf.js'

// Spacing is set in steps of 4px; a value between steps (6, 10, 14) is
// whatever each component came with. One stray value is a detail, three
// distinct ones in the main region is a screen with no scale. Authored
// content and values the browser or em maths produced are not counted.
export const offScaleSpacing: Rule = (snapshot) => {
  const { elements } = snapshot
  const values = new Set<number>()
  for (const element of elements) {
    if (!isInMain(element, elements) || isUserContent(element, elements))
      continue
    const bordered = element.borderWidths.some((width) => width > 0)
    for (const value of spacingValuesOf(element))
      if (isOffScaleSpacing(value, bordered)) values.add(Math.round(value))
  }
  if (values.size < MIN_OFF_SCALE_VALUES) return []
  const sorted = [...values].toSorted((a, b) => a - b)
  const main = elements.find((element) => element.isMain)
  return [
    {
      rule: 'off-scale-spacing',
      severity: 'warn',
      message: `the main region sets ${String(sorted.length)} spacing values off the ${String(SPACING_STEP)}px scale (${sorted.map(String).join(', ')}px); round them to multiples of ${String(SPACING_STEP)}`,
      subject: main?.selector ?? 'main',
      identity: 'spacing-scale',
    },
  ]
}
