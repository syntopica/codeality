import { axeFindings } from '@/rules/axeFindings.js'
import { bareUrl } from '@/rules/bareUrl.js'
import { blankRoute } from '@/rules/blankRoute.js'
import { consoleError } from '@/rules/consoleError.js'
import { contentWidth } from '@/rules/contentWidth.js'
import { controlInset } from '@/rules/controlInset.js'
import { edgeMisaligned } from '@/rules/edgeMisaligned.js'
import { fixedOverflow } from '@/rules/fixedOverflow.js'
import { horizontalOverflow } from '@/rules/horizontalOverflow.js'
import { iconContrast } from '@/rules/iconContrast.js'
import { inputZoom } from '@/rules/inputZoom.js'
import { palette } from '@/rules/palette.js'
import { rawPlaceholder } from '@/rules/rawPlaceholder.js'
import { rowMisaligned } from '@/rules/rowMisaligned.js'
import type { Rule } from '@/rules/Rule.js'
import { textClipped } from '@/rules/textClipped.js'
import { textHardCut } from '@/rules/textHardCut.js'

export const RULES: Rule[] = [
  axeFindings,
  bareUrl,
  blankRoute,
  consoleError,
  contentWidth,
  controlInset,
  edgeMisaligned,
  fixedOverflow,
  horizontalOverflow,
  iconContrast,
  inputZoom,
  palette,
  rawPlaceholder,
  rowMisaligned,
  textClipped,
  textHardCut,
]
