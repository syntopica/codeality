import { baselineMeasurementsOf } from '@/baseline/baselineMeasurementsOf.js'
import type { Finding } from '@/model/Finding.js'
import type { BaselineMeasurement } from '@syntopica/gate-kit/BaselineMeasurement'

/** The measurements to record with a baseline, keyed by fingerprint. */
export const recordedMeasurements = (
  findings: Finding[],
): Record<string, BaselineMeasurement[]> =>
  Object.fromEntries(
    findings
      .filter((finding) => finding.measurements)
      .map((finding) => [finding.fingerprint, baselineMeasurementsOf(finding)]),
  )
