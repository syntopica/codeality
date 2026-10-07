import type { CapturedScreen } from '@/capture/CapturedScreen.js'
import type { FailedCapture } from '@/capture/FailedCapture.js'
import { captureFailedFinding } from '@/check/captureFailedFinding.js'
import { schemeDuplicateFinding } from '@/check/schemeDuplicateFinding.js'
import { isDisabled } from '@/config/isDisabled.js'
import type { UiQualityConfig } from '@/config/UiQualityConfig.js'
import type { Finding } from '@/model/Finding.js'
import { mergeFindings } from '@/report/mergeFindings.js'
import { toFinding } from '@/report/toFinding.js'
import { runRules } from '@/rules/runRules.js'

/** The pure half of a check: captured screens in, merged and filtered findings out. */
export const findingsFrom = (
  captured: CapturedScreen[],
  failed: FailedCapture[],
  config: UiQualityConfig,
): Finding[] =>
  mergeFindings([
    ...captured.flatMap(({ route, snapshot }) =>
      runRules(snapshot, route, config).map((raw) =>
        toFinding(raw, snapshot.screen),
      ),
    ),
    ...failed.map(captureFailedFinding),
    ...[schemeDuplicateFinding(captured)].filter(
      (finding): finding is Finding => finding !== null,
    ),
  ]).filter((finding) => !isDisabled(finding, config.disable))
