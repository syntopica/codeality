import type { BenchRecord } from '@/bench/BenchRecord.js'
import type { BenchResult } from '@/bench/BenchResult.js'
import { renderFindings } from '@/check/renderFindings.js'

export const renderBench = (
  result: BenchResult,
  recorded: BenchRecord | undefined,
): string => {
  const entries = Object.entries(result.entries)
  const width = Math.max(0, ...entries.map(([file]) => file.length)) + 2
  const runs = entries[0]?.[1].runs ?? 0
  const lines = entries.map(([file, entry]) => {
    const recordedEntry = recorded?.entries[file]
    const record = recordedEntry
      ? `(record ${recordedEntry.medianMs.toFixed(2)} ms)`
      : '(no record)'
    return `  ${file.padEnd(width)}${entry.medianMs.toFixed(2)} ms   ${record}`
  })
  const improvementLines =
    result.improvements.length === 0
      ? []
      : [
          'improvements',
          ...result.improvements.map((improvement) => {
            const percent = Math.round(
              (improvement.currentMs / improvement.previousMs - 1) * 100,
            )
            return `  ${String(percent)}%   ${improvement.previousMs.toFixed(2)} ms -> ${improvement.currentMs.toFixed(2)} ms  ${improvement.subject}`
          }),
        ]
  return [
    `bench (${String(runs)} runs each)`,
    ...lines,
    ...improvementLines,
    renderFindings(result.findings),
  ].join('\n')
}
