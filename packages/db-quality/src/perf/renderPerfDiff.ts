import type { PerfDiff } from '@/perf/PerfDiff.js'
import { renderImprovements } from '@/perf/renderImprovements.js'

export const renderPerfDiff = (diff: PerfDiff): string =>
  [
    `perf diff: ${diff.from} -> ${diff.to}`,
    ...renderImprovements(diff.improvements),
    ...(diff.improvements.length > 0 || diff.lostMs > 0
      ? [
          `saved ${diff.savedMs.toLocaleString('en-US')} ms against the previous means; regressions cost ${diff.lostMs.toLocaleString('en-US')} ms`,
        ]
      : []),
    ...diff.findings.map(
      (finding) =>
        `${finding.path}:${String(finding.line)}: ${finding.code} ${finding.message} (${finding.subject})`,
    ),
    `${diff.findings.length.toLocaleString('en-US')} findings`,
  ].join('\n')
