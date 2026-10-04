/** One thing the audit found, with the evidence that makes it checkable. */
export type Finding = {
  rule: string
  severity: 'warning' | 'info'
  message: string
  evidence: string[]
}
