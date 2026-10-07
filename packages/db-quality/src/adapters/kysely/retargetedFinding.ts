import type { Finding } from '@/model/Finding.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'

// A finding a tool reported on a scratch file is moved onto the file the
// person edits. The scratch file's name is stable, so the original
// fingerprint is a stable context for the new one.
/** The finding at another path, line, subject and message, with a fingerprint for its new place. */
export const retargetedFinding = (
  finding: Finding,
  place: Pick<Finding, 'path' | 'line' | 'subject' | 'message'>,
): Finding => {
  const partial = {
    code: finding.code,
    severity: finding.severity,
    ...place,
  }
  return {
    ...partial,
    fingerprint: fingerprintFinding(partial, finding.fingerprint),
  }
}
