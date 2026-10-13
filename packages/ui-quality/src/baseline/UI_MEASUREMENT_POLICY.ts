import { baselineMeasurementsOf } from '@/baseline/baselineMeasurementsOf.js'
import { METRIC_TOLERANCES } from '@/baseline/METRIC_TOLERANCES.js'
import type { Finding } from '@/model/Finding.js'
import type { MeasurementPolicy } from '@syntopica/gate-kit/MeasurementPolicy'

/** How a baselined UI finding is compared beyond its count. */
export const UI_MEASUREMENT_POLICY: MeasurementPolicy<Finding> = {
  measurementsOf: baselineMeasurementsOf,
  toleranceOf: (metric) => METRIC_TOLERANCES.get(metric),
}
