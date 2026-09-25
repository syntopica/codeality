import type { BenchRecord } from '@/bench/BenchRecord.js'
import type { BenchResult } from '@/bench/BenchResult.js'

export const renderBenchJson = (
  result: BenchResult,
  recorded: BenchRecord | undefined,
): string =>
  JSON.stringify(
    {
      schemaVersion: 1,
      entries: result.entries,
      recorded: recorded?.entries ?? null,
      improvements: result.improvements,
      findings: result.findings,
    },
    null,
    2,
  )
