import { DATABASE_LOCATIONS } from '@/model/DATABASE_LOCATIONS.js'
import type { Finding } from '@/model/Finding.js'
import type { DiagnosticLocation } from '@syntopica/gate-kit/DiagnosticLocation'

// Line 0 means the finding concerns the whole file, so no line is given.
export const findingLocation = (finding: Finding): DiagnosticLocation => {
  if (finding.line === 0 && DATABASE_LOCATIONS.has(finding.path)) return {}
  return finding.line > 0
    ? { path: finding.path, line: finding.line }
    : { path: finding.path }
}
