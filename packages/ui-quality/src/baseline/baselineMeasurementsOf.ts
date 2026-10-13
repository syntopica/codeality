import type { Finding } from '@/model/Finding.js'
import type { BaselineMeasurement } from '@syntopica/gate-kit/BaselineMeasurement'

/** A finding's measurements as baseline records, the screen as the context. */
export const baselineMeasurementsOf = (
  finding: Finding,
): BaselineMeasurement[] =>
  (finding.measurements ?? []).map(({ metric, screen, observed }) => ({
    metric,
    context: screen,
    observed,
  }))
