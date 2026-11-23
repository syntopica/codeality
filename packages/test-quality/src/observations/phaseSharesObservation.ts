import type { DurationBreakdown } from '@/model/DurationBreakdown.js'
import type { Observation } from '@/model/Observation.js'

/**
 * Where the work went, phase by phase, whether or not one dominates. The
 * shares are of summed worker time, so they do not add up to the wall clock.
 */
export const phaseSharesObservation = (
  breakdown: DurationBreakdown | null,
): Observation[] => {
  if (breakdown === null) return []
  return [
    {
      name: 'phase-shares',
      message: `vitest reported ${breakdown.seconds.toFixed(2)} s, split across phases of worker time:`,
      evidence: Object.entries(breakdown.phases).map(
        ([phase, share]) => `${phase} ${String(share)}%`,
      ),
    },
  ]
}
