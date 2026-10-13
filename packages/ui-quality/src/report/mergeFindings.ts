import { compareFindings } from '@/model/compareFindings.js'
import type { Finding } from '@/model/Finding.js'
import { mergeMeasurements } from '@/report/mergeMeasurements.js'

/**
 * One finding per fingerprint, listing every screen it was seen at and the
 * measurement taken at each, so a wider overflow on another viewport survives
 * the merge.
 */
export const mergeFindings = (findings: Finding[]): Finding[] => {
  const merged = new Map<string, Finding>()
  for (const finding of findings) {
    const existing = merged.get(finding.fingerprint)
    if (existing) {
      existing.screens.push(...finding.screens)
      if (finding.measurements)
        existing.measurements = mergeMeasurements([
          ...(existing.measurements ?? []),
          ...finding.measurements,
        ])
    } else
      merged.set(finding.fingerprint, {
        ...finding,
        screens: [...finding.screens],
        ...(finding.measurements
          ? { measurements: [...finding.measurements] }
          : {}),
      })
  }
  return [...merged.values()].sort(compareFindings)
}
