import { accentOveruse } from '@/rules/accentOveruse.js'
import { axeFindings } from '@/rules/axeFindings.js'
import { bareUrl } from '@/rules/bareUrl.js'
import { behaviourBroken } from '@/rules/behaviourBroken.js'
import { blankRoute } from '@/rules/blankRoute.js'
import { brokenImage } from '@/rules/brokenImage.js'
import { cardRadiusAdmin } from '@/rules/cardRadiusAdmin.js'
import { clickFailed } from '@/rules/clickFailed.js'
import { consoleError } from '@/rules/consoleError.js'
import { contentHiddenAtRest } from '@/rules/contentHiddenAtRest.js'
import { contentWidth } from '@/rules/contentWidth.js'
import { controlInset } from '@/rules/controlInset.js'
import { duplicateNavIcon } from '@/rules/duplicateNavIcon.js'
import { edgeMisaligned } from '@/rules/edgeMisaligned.js'
import { emptyDialog } from '@/rules/emptyDialog.js'
import { fixedOverflow } from '@/rules/fixedOverflow.js'
import { focusInvisible } from '@/rules/focusInvisible.js'
import { ghostElevation } from '@/rules/ghostElevation.js'
import { horizontalOverflow } from '@/rules/horizontalOverflow.js'
import { iconContrast } from '@/rules/iconContrast.js'
import { inputZoom } from '@/rules/inputZoom.js'
import { letterSpacing } from '@/rules/letterSpacing.js'
import { mixedIconFamily } from '@/rules/mixedIconFamily.js'
import { nestedCards } from '@/rules/nestedCards.js'
import { numericAlignment } from '@/rules/numericAlignment.js'
import { palette } from '@/rules/palette.js'
import { placeholderFit } from '@/rules/placeholderFit.js'
import { radiusSprawl } from '@/rules/radiusSprawl.js'
import { rawPlaceholder } from '@/rules/rawPlaceholder.js'
import { rowMisaligned } from '@/rules/rowMisaligned.js'
import type { Rule } from '@/rules/Rule.js'
import { slowRequest } from '@/rules/slowRequest.js'
import { textClipped } from '@/rules/textClipped.js'
import { textHardCut } from '@/rules/textHardCut.js'
import { textOcclusion } from '@/rules/textOcclusion.js'
import { tightLeading } from '@/rules/tightLeading.js'
import { touchTarget } from '@/rules/touchTarget.js'
import { transitionAll } from '@/rules/transitionAll.js'
import { typeScaleSprawl } from '@/rules/typeScaleSprawl.js'
import { undersizedText } from '@/rules/undersizedText.js'
import { unstableMediaSize } from '@/rules/unstableMediaSize.js'

export const RULES: Rule[] = [
  accentOveruse,
  nestedCards,
  textOcclusion,
  typeScaleSprawl,
  axeFindings,
  bareUrl,
  behaviourBroken,
  blankRoute,
  brokenImage,
  cardRadiusAdmin,
  clickFailed,
  consoleError,
  contentHiddenAtRest,
  contentWidth,
  controlInset,
  duplicateNavIcon,
  edgeMisaligned,
  emptyDialog,
  fixedOverflow,
  focusInvisible,
  ghostElevation,
  horizontalOverflow,
  iconContrast,
  inputZoom,
  letterSpacing,
  mixedIconFamily,
  numericAlignment,
  palette,
  placeholderFit,
  radiusSprawl,
  rawPlaceholder,
  rowMisaligned,
  slowRequest,
  textClipped,
  textHardCut,
  tightLeading,
  touchTarget,
  transitionAll,
  undersizedText,
  unstableMediaSize,
]
