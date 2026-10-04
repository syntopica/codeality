import type { FileDuration } from '@/model/FileDuration.js'
import type { Finding } from '@/model/Finding.js'

/** The slowest test files, with the total their tests took. */
export const slowestFiles = (
  durations: FileDuration[],
  count: number,
): Finding[] => {
  if (durations.length === 0) return []
  const total = durations.reduce((sum, d) => sum + d.seconds, 0)
  return [
    {
      rule: 'slowest-files',
      severity: 'info',
      message: `tests in ${String(durations.length)} files took ${total.toFixed(1)} s of worker time; the ${String(Math.min(count, durations.length))} slowest:`,
      evidence: durations
        .slice(0, count)
        .map((d) => `${d.seconds.toFixed(2)} s ${d.file}`),
    },
  ]
}
