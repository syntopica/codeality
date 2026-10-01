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
}
