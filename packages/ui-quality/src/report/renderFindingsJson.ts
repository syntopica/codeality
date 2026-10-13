import type { Finding } from '@/model/Finding.js'
import { findingDiagnostic } from '@/report/findingDiagnostic.js'

// `findings` keeps the tool's own shape for existing readers; `diagnostics`
// is the shape shared by every codeality gate.
export const renderFindingsJson = (findings: Finding[]): string =>
  JSON.stringify(
    {
      findings,
      schemaVersion: 1,
      diagnostics: findings.map(findingDiagnostic),
    },
    null,
    2,
  )
