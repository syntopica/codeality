export type SodaCheckResult = {
  name: string
  outcome: 'pass' | 'fail' | 'warn' | 'error'
  table?: string
  column?: string
}
