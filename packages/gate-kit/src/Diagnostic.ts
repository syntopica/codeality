import type { DiagnosticLocation } from './DiagnosticLocation.js'

/**
 * One finding in the shape every codeality gate reports with `--json`, so an
 * agent or a CI step reads the same fields whichever gate failed: what broke,
 * where, by how much against what limit, what to change, and how to check it
 * again. `observed` and `threshold` are present only for measured rules.
 */
export type Diagnostic = {
  tool: string
  rule: string
  severity: 'error' | 'warning'
  location: DiagnosticLocation
  message: string
  fingerprint: string
  observed?: number
  threshold?: number
  fix?: string
  rerun: string
}
