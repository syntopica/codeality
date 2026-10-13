import type { BenchRecord } from '@/bench/BenchRecord.js'
import type { BenchResult } from '@/bench/BenchResult.js'
import { findingDiagnostic } from '@/report/findingDiagnostic.js'
import { perfRerun } from '@/report/perfRerun.js'

export const renderBenchJson = (
  result: BenchResult,
  recorded: BenchRecord | undefined,
  rerunFlags: string,
): string =>
  JSON.stringify(
    {
      schemaVersion: 1,
      entries: result.entries,
      recorded: recorded?.entries ?? null,
      improvements: result.improvements,
      findings: result.findings,
      diagnostics: result.findings.map((finding) =>
        findingDiagnostic(finding, perfRerun(finding, rerunFlags)),
      ),
    },
    null,
    2,
  )
