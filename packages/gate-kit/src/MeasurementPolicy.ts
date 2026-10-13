import type { BaselineMeasurement } from './BaselineMeasurement.js'

/**
 * How a tool measures its findings for the baseline. `toleranceOf` returns
 * how far a value may rise before it counts as worse, or `undefined` for a
 * metric the tool does not compare.
 */
export type MeasurementPolicy<F> = {
  measurementsOf: (finding: F) => BaselineMeasurement[]
  toleranceOf: (metric: string) => number | undefined
}
