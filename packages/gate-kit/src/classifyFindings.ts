import type { BaselineFile } from './BaselineFile.js'
import type { ClassifiedFindings } from './ClassifiedFindings.js'
import { countEntries } from './countEntries.js'
import type { Fingerprinted } from './Fingerprinted.js'
import { isWorsened } from './isWorsened.js'
import type { MeasurementPolicy } from './MeasurementPolicy.js'

// A baseline records each fingerprint as often as it was reported, so a known
// violation that now occurs more often is new for every extra occurrence:
// membership alone would let one accepted defect multiply unnoticed. A
// baseline entry nothing reports any more is resolved, and reporting it is
// what stops dead debt being carried forever.
//
// With a measurement policy, a known finding measured worse than its accepted
// value is new as well (and listed in `worsened`): it still consumes its
// occurrence, so it is never also reported as resolved. The comparison is
// against the recorded value, never the last run, so small rises cannot
// accumulate.
export const classifyFindings = <F extends Fingerprinted>(
  findings: F[],
  baseline: BaselineFile,
  policy?: MeasurementPolicy<F>,
): ClassifiedFindings<F> => {
  const allowance = countEntries(baseline.entries)
  const classified: ClassifiedFindings<F> = {
    new: [],
    known: [],
    worsened: [],
    resolved: [],
  }
  for (const finding of findings) {
    const left = allowance.get(finding.fingerprint) ?? 0
    if (left === 0) {
      classified.new.push(finding)
      continue
    }
    allowance.set(finding.fingerprint, left - 1)
    if (
      policy &&
      isWorsened(
        policy.measurementsOf(finding),
        baseline.measurements?.[finding.fingerprint],
        policy.toleranceOf,
      )
    ) {
      classified.new.push(finding)
      classified.worsened.push(finding)
    } else {
      classified.known.push(finding)
    }
  }
  classified.resolved = [...allowance]
    .flatMap(([entry, left]) => Array<string>(left).fill(entry))
    .sort()
  return classified
}
