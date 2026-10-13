import type { Finding } from '@/model/Finding.js'
import type { Diagnostic } from '@syntopica/gate-kit/Diagnostic'

/** A finding in the shared gate diagnostics shape, rerun on its own route. */
export const findingDiagnostic = (finding: Finding): Diagnostic => ({
  tool: 'codeality-ui',
  rule: finding.rule,
  severity: finding.severity,
  location: { route: finding.route },
  message: finding.message,
  fingerprint: finding.fingerprint,
  rerun: `codeality-ui check --routes '${finding.route}'`,
})
