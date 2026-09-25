export type SquawkEntry = {
  file: string
  line: number
  level: 'Warning' | 'Error'
  message: string
  rule_name: string
}
