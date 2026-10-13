import type { BaselineFile } from './BaselineFile.js'
import type { ClassifiedFindings } from './ClassifiedFindings.js'
import { countEntries } from './countEntries.js'
import type { Fingerprinted } from './Fingerprinted.js'

// A baseline records each fingerprint as often as it was reported, so a known
// violation that now occurs more often is new for every extra occurrence:
// membership alone would let one accepted defect multiply unnoticed. A
// baseline entry nothing reports any more is resolved, and reporting it is
// what stops dead debt being carried forever.
export const classifyFindings = <F extends Fingerprinted>(
  findings: F[],
  baseline: BaselineFile,
): ClassifiedFindings<F> => {
  const allowance = countEntries(baseline.entries)
  const classified: ClassifiedFindings<F> = { new: [], known: [], resolved: [] }
  for (const finding of findings) {
    const left = allowance.get(finding.fingerprint) ?? 0
    if (left > 0) {
      allowance.set(finding.fingerprint, left - 1)
      classified.known.push(finding)
    } else {
      classified.new.push(finding)
    }
  }
  classified.resolved = [...allowance]
    .flatMap(([entry, left]) => Array<string>(left).fill(entry))
    .sort()
  return classified
}
