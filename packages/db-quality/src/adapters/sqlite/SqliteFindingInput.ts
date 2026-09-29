import type { Severity } from '@/model/Severity.js'

export type SqliteFindingInput = {
  code: string
  severity: Severity
  file: string
  line?: number
  subject: string
  message: string
  context: string
}
