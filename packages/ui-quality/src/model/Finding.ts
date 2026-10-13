import type { ScreenMeasurement } from '@/model/ScreenMeasurement.js'
import type { Severity } from '@/model/Severity.js'

/** One reported defect. `screens` lists every viewport and scheme it was seen at. */
export type Finding = {
  rule: string
  severity: Severity
  route: string
  screens: string[]
  message: string
  subject: string
  fingerprint: string
  /** One per screen it was measured at, for the rules that measure. */
  measurements?: ScreenMeasurement[]
}
