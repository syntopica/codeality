import type { Finding } from '@/model/Finding.js'
import { findingDiagnostic } from '@/report/findingDiagnostic.js'

// `findings` keeps this tool's own shape; `diagnostics` is the shape shared
// by every codeality gate.
export const renderFindingsJson = (
  findings: Finding[],
  rerun: string,
): string =>
  JSON.stringify(
    {
      schemaVersion: 1,
      findings,
      diagnostics: findings.map((finding) => findingDiagnostic(finding, rerun)),
    },
    null,
    2,
  )
