import type { BaselineFile } from './BaselineFile.js'
import type { ClassifiedFindings } from './ClassifiedFindings.js'
import type { Fingerprinted } from './Fingerprinted.js'

// A baseline entry nothing reports any more is resolved, and reporting it is
// what stops dead debt being carried forever.
export const classifyFindings = <F extends Fingerprinted>(
  findings: F[],
  baseline: BaselineFile,
): ClassifiedFindings<F> => {
  const entries = new Set(baseline.entries)
  const current = new Set(findings.map((finding) => finding.fingerprint))
  return {
    new: findings.filter((finding) => !entries.has(finding.fingerprint)),
    known: findings.filter((finding) => entries.has(finding.fingerprint)),
    resolved: baseline.entries.filter((entry) => !current.has(entry)).sort(),
  }
}
