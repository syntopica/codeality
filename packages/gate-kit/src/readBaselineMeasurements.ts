import type { BaselineMeasurement } from './BaselineMeasurement.js'
import { ConfigError } from './ConfigError.js'
import { isBaselineMeasurement } from './isBaselineMeasurement.js'

/**
 * Validates a baseline's `measurements`: every key must be a recorded entry
 * and every value a finite measurement. A malformed record is refused rather
 * than ignored, since ignoring it would silently stop the comparison.
 */
export const readBaselineMeasurements = (
  value: unknown,
  entries: string[],
  filename: string,
): Record<string, BaselineMeasurement[]> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new ConfigError(`${filename}: "measurements" is not an object`)
  const known = new Set(entries)
  const measurements: Record<string, BaselineMeasurement[]> = {}
  for (const fingerprint of Object.keys(value)) {
    const records: unknown = Reflect.get(value, fingerprint)
    if (!known.has(fingerprint))
      throw new ConfigError(
        `${filename}: measurements for ${fingerprint}, which is not an entry`,
      )
    const list: unknown[] = Array.isArray(records) ? records : [null]
    if (!list.every(isBaselineMeasurement))
      throw new ConfigError(
        `${filename}: malformed measurements for ${fingerprint}`,
      )
    // Two records of one metric at one context would make the comparison
    // depend on their order.
    const places = list.map(({ metric, context }) => `${metric}|${context}`)
    if (new Set(places).size !== places.length)
      throw new ConfigError(
        `${filename}: duplicate measurements for ${fingerprint}`,
      )
    measurements[fingerprint] = list
  }
  return measurements
}
