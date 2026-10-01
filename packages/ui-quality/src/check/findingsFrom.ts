import type { CapturedScreen } from '@/capture/CapturedScreen.js'
import { isDisabled } from '@/config/isDisabled.js'
import type { UiQualityConfig } from '@/config/UiQualityConfig.js'
import type { Finding } from '@/model/Finding.js'
import { mergeFindings } from '@/report/mergeFindings.js'
import { toFinding } from '@/report/toFinding.js'
import { runRules } from '@/rules/runRules.js'

/** The pure half of a check: captured screens in, merged and filtered findings out. */
export const findingsFrom = (
  captured: CapturedScreen[],
  config: UiQualityConfig,
): Finding[] =>
  mergeFindings(
    captured.flatMap(({ route, snapshot }) =>
      runRules(snapshot, route, config).map((raw) =>
        toFinding(raw, snapshot.screen),
      ),
    ),
  ).filter((finding) => !isDisabled(finding, config.disable))
