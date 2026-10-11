import type { Report } from '@/model/Report.js'
import { formatEntry } from '@/report/formatters/formatEntry.js'
import { formatFindings } from '@/report/formatters/formatFindings.js'

/** The observations first, unlabelled, then the findings or `no findings`. */
export const formatReport = ({ findings, observations }: Report): string =>
  [
    ...observations.map((observation) =>
      formatEntry(
        `${observation.name}: ${observation.message}`,
        observation.evidence,
      ),
    ),
    formatFindings(findings),
  ]
    .join('\n\n')
    .concat('\n')
