import type { DisableEntry } from '@/config/DisableEntry.js'
import { isDisabled } from '@/config/isDisabled.js'
import type { PerfConfig } from '@/config/PerfConfig.js'
import type { Finding } from '@/model/Finding.js'
import { statementRegressionFinding } from '@/perf/statementRegressionFinding.js'
import { statementSlowFinding } from '@/perf/statementSlowFinding.js'
import { statementSpillFinding } from '@/perf/statementSpillFinding.js'
import type { StatementWindow } from '@/perf/StatementWindow.js'

export const statementFindings = (
  windows: StatementWindow[],
  perf: PerfConfig,
  disabled: DisableEntry[],
): Finding[] =>
  windows
    .filter((window) => window.calls >= perf.minCalls)
    .flatMap((window) => [
      statementRegressionFinding(window, perf),
      statementSlowFinding(window, perf),
      statementSpillFinding(window),
    ])
    .filter((finding): finding is Finding => finding !== null)
    .filter((finding) => !isDisabled(finding.code, disabled))
