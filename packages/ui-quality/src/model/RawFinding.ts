import type { Measurement } from '@/model/Measurement.js'
import type { Severity } from '@/model/Severity.js'

/** What a rule returns, before the screen and fingerprint are attached. */
export type RawFinding = {
  rule: string
  severity: Severity
  message: string
  subject: string
  /** What tells two findings of one rule on one route apart; never pixel values. */
  identity: string
  /** The measured value, for the rules that measure one. */
  measurement?: Measurement
}
