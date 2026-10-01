import type { Finding } from '@/model/Finding.js'

export const renderFindings = (findings: Finding[]): string =>
  [
    ...findings.map(
      (f) =>
        `${f.route} [${f.screens.join(', ')}] ${f.severity} ${f.rule}: ${f.message}${f.subject ? `\n    at ${f.subject}` : ''}`,
    ),
    `${String(findings.length)} findings`,
  ].join('\n')
