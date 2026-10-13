import type { ScreenMeasurement } from '@/model/ScreenMeasurement.js'

/**
 * One measurement per metric and screen, the worst kept. Two captures of the
 * same screen (a viewport listed twice) would otherwise leave two records, and
 * the baseline comparison would depend on their order.
 */
export const mergeMeasurements = (
  measurements: ScreenMeasurement[],
): ScreenMeasurement[] => {
  const worst = new Map<string, ScreenMeasurement>()
  for (const measurement of measurements) {
    const key = `${measurement.metric}|${measurement.screen}`
    const kept = worst.get(key)
    if (!kept || measurement.observed > kept.observed)
      worst.set(key, measurement)
  }
  return [...worst.values()]
}
