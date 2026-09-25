import type { DisableEntry } from '@/config/DisableEntry.js'
import { isDisabled } from '@/config/isDisabled.js'
import type { PerfConfig } from '@/config/PerfConfig.js'
import type { Finding } from '@/model/Finding.js'
import { perfFinding } from '@/perf/perfFinding.js'
import type { TableWindow } from '@/perf/TableWindow.js'

export const tableFindings = (
  windows: TableWindow[],
  perf: PerfConfig,
  disabled: DisableEntry[],
): Finding[] =>
  windows
    .filter(
      (window) =>
        window.liveRows >= perf.seqScanRows && window.seqScan > window.idxScan,
    )
    .map((window) =>
      perfFinding(
        'BDB903',
        window.name,
        window.name,
        `${window.seqScan.toLocaleString('en-US')} sequential scans against ${window.idxScan.toLocaleString('en-US')} index scans on ${window.liveRows.toLocaleString('en-US')} live rows`,
      ),
    )
    .filter((finding) => !isDisabled(finding.code, disabled))
