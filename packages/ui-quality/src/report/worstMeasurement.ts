import type { ScreenMeasurement } from '@/model/ScreenMeasurement.js'

/** The measurement with the highest `observed` across a finding's screens, if any. */
export const worstMeasurement = (
  measurements: ScreenMeasurement[] | undefined,
): ScreenMeasurement | undefined =>
  measurements?.reduce<ScreenMeasurement | undefined>(
    (worst, measurement) =>
      !worst || measurement.observed > worst.observed ? measurement : worst,
    undefined,
  )
