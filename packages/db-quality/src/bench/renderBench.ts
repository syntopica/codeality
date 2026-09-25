import type { BenchRecord } from '@/bench/BenchRecord.js'
import type { BenchResult } from '@/bench/BenchResult.js'
import { renderFindings } from '@/check/renderFindings.js'

export const renderBench = (
  result: BenchResult,
  recorded: BenchRecord | undefined,
): string => {
  const entries = Object.entries(result.entries)
  const width = Math.max(0, ...entries.map(([file]) => file.length)) + 2
  const runs = new Set(entries.map(([, entry]) => entry.runs))
  const perFile = runs.size > 1
  const lines = entries.map(([file, entry]) => {
    const recordedEntry = recorded?.entries[file]
    const record = recordedEntry
      ? `(record ${recordedEntry.medianMs.toFixed(2)} ms)`
      : '(no record)'
    const count = perFile ? `   ${String(entry.runs)} runs` : ''
    return `  ${file.padEnd(width)}${entry.medianMs.toFixed(2)} ms   ${record}${count}`
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
    perFile
      ? 'bench (runs per file)'
      : `bench (${String([...runs][0] ?? 0)} runs each)`,
    ...lines,
    ...improvementLines,
    renderFindings(result.findings),
  ].join('\n')
}
