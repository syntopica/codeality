import type { BaselineMeasurement } from './BaselineMeasurement.js'

/** Whether a parsed value is a measurement with a finite `observed`. */
export const isBaselineMeasurement = (
  value: unknown,
): value is BaselineMeasurement =>
  typeof value === 'object' &&
  value !== null &&
  'metric' in value &&
  typeof value.metric === 'string' &&
  'context' in value &&
  typeof value.context === 'string' &&
  'observed' in value &&
  typeof value.observed === 'number' &&
  Number.isFinite(value.observed)
