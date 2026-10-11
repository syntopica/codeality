/**
 * One thing the audit found, with the evidence that makes it checkable. Every
 * finding is an error and fails the command; a reading that asks for no change
 * is an Observation instead.
 */
export type Finding = {
  rule: string
  severity: 'error'
  message: string
  evidence: string[]
}
