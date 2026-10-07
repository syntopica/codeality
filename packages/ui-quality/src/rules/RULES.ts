import { axeFindings } from '@/rules/axeFindings.js'
import { bareUrl } from '@/rules/bareUrl.js'
import { behaviourBroken } from '@/rules/behaviourBroken.js'
import { blankRoute } from '@/rules/blankRoute.js'
import { clickFailed } from '@/rules/clickFailed.js'
import { consoleError } from '@/rules/consoleError.js'
import { contentWidth } from '@/rules/contentWidth.js'
import { controlInset } from '@/rules/controlInset.js'
import { duplicateNavIcon } from '@/rules/duplicateNavIcon.js'
import { edgeMisaligned } from '@/rules/edgeMisaligned.js'
import { emptyDialog } from '@/rules/emptyDialog.js'
import { fixedOverflow } from '@/rules/fixedOverflow.js'
import { horizontalOverflow } from '@/rules/horizontalOverflow.js'
import { iconContrast } from '@/rules/iconContrast.js'
import { inputZoom } from '@/rules/inputZoom.js'
import { mixedIconFamily } from '@/rules/mixedIconFamily.js'
import { palette } from '@/rules/palette.js'
import { placeholderFit } from '@/rules/placeholderFit.js'
import { rawPlaceholder } from '@/rules/rawPlaceholder.js'
import { rowMisaligned } from '@/rules/rowMisaligned.js'
import type { Rule } from '@/rules/Rule.js'
import { slowRequest } from '@/rules/slowRequest.js'
import { textClipped } from '@/rules/textClipped.js'
import { textHardCut } from '@/rules/textHardCut.js'
import { transitionAll } from '@/rules/transitionAll.js'

export const RULES: Rule[] = [
  axeFindings,
  bareUrl,
  behaviourBroken,
  blankRoute,
  clickFailed,
  consoleError,
  contentWidth,
  duplicateNavIcon,
  controlInset,
  edgeMisaligned,
  emptyDialog,
  fixedOverflow,
  horizontalOverflow,
  iconContrast,
  inputZoom,
  mixedIconFamily,
  palette,
  placeholderFit,
  rawPlaceholder,
  rowMisaligned,
  slowRequest,
  textClipped,
  textHardCut,
  transitionAll,
]
