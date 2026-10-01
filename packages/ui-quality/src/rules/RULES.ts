import { axeFindings } from '@/rules/axeFindings.js'
import { blankRoute } from '@/rules/blankRoute.js'
import { contentWidth } from '@/rules/contentWidth.js'
import { controlInset } from '@/rules/controlInset.js'
import { horizontalOverflow } from '@/rules/horizontalOverflow.js'
import { palette } from '@/rules/palette.js'
import { rowMisaligned } from '@/rules/rowMisaligned.js'
import type { Rule } from '@/rules/Rule.js'
import { textClipped } from '@/rules/textClipped.js'
import { textHardCut } from '@/rules/textHardCut.js'

export const RULES: Rule[] = [
  axeFindings,
  blankRoute,
  contentWidth,
  controlInset,
  horizontalOverflow,
  palette,
  rowMisaligned,
  textClipped,
  textHardCut,
]
