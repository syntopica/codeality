import type { Finding } from '@/model/Finding.js'
import { shellQuoted } from '@/report/shellQuoted.js'
import { worstMeasurement } from '@/report/worstMeasurement.js'
import type { Diagnostic } from '@syntopica/gate-kit/Diagnostic'

/**
 * A finding in the shared gate diagnostics shape, rerun on its own route.
 * `observed` is the worst measurement across its screens.
 */
export const findingDiagnostic = (finding: Finding): Diagnostic => {
  const worst = worstMeasurement(finding.measurements)
  return {
    tool: 'codeality-ui',
    rule: finding.rule,
    severity: finding.severity,
    location: { route: finding.route },
    message: finding.message,
    fingerprint: finding.fingerprint,
    ...(worst ? { observed: worst.observed } : {}),
    ...(worst?.threshold === undefined ? {} : { threshold: worst.threshold }),
    rerun: `codeality-ui check --routes ${shellQuoted(finding.route)}`,
  }
}
