import type { Finding } from '@/model/Finding.js'
import { findingLocation } from '@/report/findingLocation.js'
import type { Diagnostic } from '@syntopica/gate-kit/Diagnostic'

/**
 * A finding in the shared gate diagnostics shape. `rerun` is a fixed command
 * chosen by whoever produced the finding: it never carries a path or a
 * database URL, so nothing from the repository or the target reaches a shell.
 */
export const findingDiagnostic = (
  finding: Finding,
  rerun: string,
): Diagnostic => ({
  tool: 'codeality-db',
  rule: finding.code,
  severity: finding.severity,
  location: findingLocation(finding),
  message: finding.message,
  fingerprint: finding.fingerprint,
  rerun,
})
