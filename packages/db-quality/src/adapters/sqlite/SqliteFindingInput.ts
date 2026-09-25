import type { Severity } from '@/model/Severity.js'

export type SqliteFindingInput = {
  code: string
  severity: Severity
  file: string
  subject: string
  message: string
  context: string
}
