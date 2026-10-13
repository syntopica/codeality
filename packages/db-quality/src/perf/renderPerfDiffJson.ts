import type { PerfDiff } from '@/perf/PerfDiff.js'
import { findingDiagnostic } from '@/report/findingDiagnostic.js'
import { perfRerun } from '@/report/perfRerun.js'

export const renderPerfDiffJson = (
  diff: PerfDiff,
  rerunFlags: string,
): string =>
  JSON.stringify(
    {
      schemaVersion: 1,
      from: diff.from,
      to: diff.to,
      savedMs: diff.savedMs,
      lostMs: diff.lostMs,
      improvements: diff.improvements,
      findings: diff.findings,
      diagnostics: diff.findings.map((finding) =>
        findingDiagnostic(finding, perfRerun(finding, rerunFlags)),
      ),
    },
    null,
    2,
  )
