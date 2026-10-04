import type { DurationBreakdown } from '@/model/DurationBreakdown.js'
import { ENVIRONMENT_SHARE } from '@/model/ENVIRONMENT_SHARE.js'
import type { Finding } from '@/model/Finding.js'

/**
 * The suite spends more building environments than running tests. In
 * verticagtm (2026-10-04) environment was 61-72% and tests 5%.
 */
export const environmentDominates = (
  breakdown: DurationBreakdown | null,
): Finding[] => {
  const environment = breakdown?.phases['environment'] ?? 0
  const tests = breakdown?.phases['tests'] ?? 0
  if (environment < ENVIRONMENT_SHARE || environment <= tests) return []
  return [
    {
      rule: 'environment-dominates',
      severity: 'warning',
      message: `building test environments is ${String(environment)}% of the work; running tests is ${String(tests)}%`,
      evidence: Object.entries(breakdown?.phases ?? {}).map(
        ([phase, share]) => `${phase} ${String(share)}%`,
      ),
    },
  ]
}
