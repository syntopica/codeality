import type { Measurement } from '@/model/Measurement.js'

/** The worse of two measurements of one metric: the higher `observed`. */
export const worseMeasurement = (
  current: Measurement | undefined,
  next: Measurement | undefined,
): Measurement | undefined => {
  if (!current) return next
  if (!next) return current
  return next.observed > current.observed ? next : current
}
