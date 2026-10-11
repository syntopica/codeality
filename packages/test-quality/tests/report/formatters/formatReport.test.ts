import { describe, expect, it } from 'vitest'

import { formatReport } from '@/report/formatters/formatReport.js'

describe('formatReport', () => {
  it('prints observations unlabelled before the findings', () => {
    expect(
      formatReport({
        findings: [
          { rule: 'r', severity: 'error', message: 'm', evidence: ['e'] },
        ],
        observations: [{ name: 'o', message: 'took 1 s', evidence: [] }],
      }),
    ).toBe('o: took 1 s\n\nerror r: m\n  e\n')
  })
  it('says no findings when only observations are left', () => {
    expect(
      formatReport({
        findings: [],
        observations: [{ name: 'o', message: 'took 1 s', evidence: [] }],
      }),
    ).toBe('o: took 1 s\n\nno findings\n')
  })
})
