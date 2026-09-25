import type { Improvement } from '@/perf/Improvement.js'

export const renderImprovements = (improvements: Improvement[]): string[] =>
  improvements.length === 0
    ? []
    : [
        'improvements',
        ...improvements.map((improvement) => {
          const percent = Math.round(
            (improvement.currentMs / improvement.previousMs - 1) * 100,
          )
          return `  ${String(percent)}%   ${improvement.previousMs.toFixed(2)} ms -> ${improvement.currentMs.toFixed(2)} ms  x${improvement.calls.toLocaleString('en-US')}  ${improvement.subject}`
        }),
      ]
