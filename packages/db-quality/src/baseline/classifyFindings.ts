import type { BaselineFile } from '@/baseline/BaselineFile.js'
import type { ClassifiedFindings } from '@/baseline/ClassifiedFindings.js'
import type { Finding } from '@/model/Finding.js'

// A baseline entry nothing reports any more is resolved, and reporting it is
// what stops dead debt being carried forever.
export const classifyFindings = (
  findings: Finding[],
  baseline: BaselineFile,
): ClassifiedFindings => {
  const entries = new Set(baseline.entries)
  const current = new Set(findings.map((finding) => finding.fingerprint))
  return {
    new: findings.filter((finding) => !entries.has(finding.fingerprint)),
    known: findings.filter((finding) => entries.has(finding.fingerprint)),
    resolved: baseline.entries.filter((entry) => !current.has(entry)).sort(),
  }
}
