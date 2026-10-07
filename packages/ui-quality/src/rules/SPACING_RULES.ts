import { groupGapRatio } from '@/rules/groupGapRatio.js'
import { headingRhythm } from '@/rules/headingRhythm.js'
import { offScaleSpacing } from '@/rules/offScaleSpacing.js'
import type { Rule } from '@/rules/Rule.js'
import { textCramped } from '@/rules/textCramped.js'

/** The rules about space: the scale, the rhythm of headings, grouping and padding. */
export const SPACING_RULES: Rule[] = [
  groupGapRatio,
  headingRhythm,
  offScaleSpacing,
  textCramped,
]
