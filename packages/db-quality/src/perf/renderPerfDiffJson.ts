import type { PerfDiff } from '@/perf/PerfDiff.js'

export const renderPerfDiffJson = (diff: PerfDiff): string =>
  JSON.stringify(
    {
      schemaVersion: 1,
      from: diff.from,
      to: diff.to,
      savedMs: diff.savedMs,
      lostMs: diff.lostMs,
      improvements: diff.improvements,
      findings: diff.findings,
    },
    null,
    2,
  )
