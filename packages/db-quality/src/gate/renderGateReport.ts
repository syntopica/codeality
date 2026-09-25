import type { StageResult } from '@/gate/StageResult.js'

export const renderGateReport = (results: StageResult[]): string =>
  results
    .flatMap((result) => [
      `${result.status.padStart(22)}  ${result.name.padEnd(14)}${result.durationSeconds.toFixed(2).padStart(8)}s`,
      ...(result.status === 'passed' || !result.detail
        ? []
        : result.detail.split('\n').map((line) => `  ${line}`)),
    ])
    .join('\n')
