import type { BaselineMeasurement } from './BaselineMeasurement.js'

/**
 * Whether any current measurement exceeds the recorded one of the same metric
 * and context by more than its tolerance. A value with no recorded
 * counterpart, or of a metric with no tolerance, is not compared.
 */
export const isWorsened = (
  current: BaselineMeasurement[],
  recorded: BaselineMeasurement[] | undefined,
  toleranceOf: (metric: string) => number | undefined,
): boolean =>
  current.some((measurement) => {
    const tolerance = toleranceOf(measurement.metric)
    if (tolerance === undefined) return false
    const accepted = recorded?.find(
      (record) =>
        record.metric === measurement.metric &&
        record.context === measurement.context,
    )
    return (
      accepted !== undefined &&
      measurement.observed - accepted.observed > tolerance
    )
  })
