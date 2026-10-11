import type { Finding } from '@/model/Finding.js'
import { formatEntry } from '@/report/formatters/formatEntry.js'

/** Human-readable findings; long evidence lists are cut, `--json` has them all. */
export const formatFindings = (findings: Finding[]): string =>
  findings.length === 0
    ? 'no findings'
    : findings
        .map((finding) =>
          formatEntry(
            `${finding.severity} ${finding.rule}: ${finding.message}`,
            finding.evidence,
          ),
        )
        .join('\n\n')
