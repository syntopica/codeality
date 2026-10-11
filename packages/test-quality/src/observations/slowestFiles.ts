import type { FileDuration } from '@/model/FileDuration.js'
import type { Observation } from '@/model/Observation.js'

/** The slowest test files, with the total their tests took. */
export const slowestFiles = (
  durations: FileDuration[],
  count: number,
): Observation[] => {
  if (durations.length === 0) return []
  const total = durations.reduce((sum, d) => sum + d.seconds, 0)
  return [
    {
      name: 'slowest-files',
      message: `tests in ${String(durations.length)} files took ${total.toFixed(1)} s of worker time; the ${String(Math.min(count, durations.length))} slowest:`,
      evidence: durations
        .slice(0, count)
        .map((d) => `${d.seconds.toFixed(2)} s ${d.file}`),
    },
  ]
}
