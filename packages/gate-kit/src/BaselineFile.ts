import type { BaselineMeasurement } from './BaselineMeasurement.js'

/**
 * The fingerprints a project has agreed to carry. `measurements`, keyed by
 * fingerprint, holds the accepted value of measured findings; a writer that
 * predates it drops it, which turns the comparison back into a count.
 */
export type BaselineFile = {
  schemaVersion: 1
  toolVersion: string
  entries: string[]
  measurements?: Record<string, BaselineMeasurement[]>
}
