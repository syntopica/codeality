import type { BaselineMeasurement } from './BaselineMeasurement.js'

/** Whether a parsed value is a measurement with a finite `observed`. */
export const isBaselineMeasurement = (
  value: unknown,
): value is BaselineMeasurement => {
  if (typeof value !== 'object' || value === null) return false
  const { metric, context, observed } = value as Record<string, unknown>
  return (
    typeof metric === 'string' &&
    typeof context === 'string' &&
    typeof observed === 'number' &&
    Number.isFinite(observed)
  )
}
