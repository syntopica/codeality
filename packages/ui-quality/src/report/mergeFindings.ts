import { compareFindings } from '@/model/compareFindings.js'
import type { Finding } from '@/model/Finding.js'

/** One finding per fingerprint, listing every screen it was seen at. */
export const mergeFindings = (findings: Finding[]): Finding[] => {
  const merged = new Map<string, Finding>()
  for (const finding of findings) {
    const existing = merged.get(finding.fingerprint)
    if (existing) existing.screens.push(...finding.screens)
    else
      merged.set(finding.fingerprint, {
        ...finding,
        screens: [...finding.screens],
      })
  }
  return [...merged.values()].sort(compareFindings)
}
