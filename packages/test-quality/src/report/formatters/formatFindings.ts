import { EVIDENCE_SHOWN } from '@/model/EVIDENCE_SHOWN.js'
import type { Finding } from '@/model/Finding.js'

/** Human-readable findings; long evidence lists are cut, `--json` has them all. */
export const formatFindings = (findings: Finding[]): string => {
  if (findings.length === 0) return 'no findings\n'
  return findings
    .map((finding) => {
      const shown = finding.evidence.slice(0, EVIDENCE_SHOWN)
      const more = finding.evidence.length - shown.length
      return [
        `${finding.severity} ${finding.rule}: ${finding.message}`,
        ...shown.map((line) => `  ${line}`),
        ...(more > 0 ? [`  ... ${String(more)} more (--json lists all)`] : []),
      ].join('\n')
    })
    .join('\n\n')
    .concat('\n')
}
