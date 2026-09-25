import type { Finding } from '@/model/Finding.js'

export const renderFindings = (findings: Finding[]): string =>
  [
    ...findings.map(
      (f) =>
        `${f.path}:${String(f.line)}: ${f.code} ${f.message}${f.subject ? ` (${f.subject})` : ''}`,
    ),
    `${String(findings.length)} findings`,
  ].join('\n')
