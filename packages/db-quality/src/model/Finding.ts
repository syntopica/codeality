import type { Severity } from '@/model/Severity.js'

/** One reported violation, whatever tool produced it. */
export type Finding = {
  code: string
  severity: Severity
  path: string
  line: number
  message: string
  subject: string
  fingerprint: string
}
