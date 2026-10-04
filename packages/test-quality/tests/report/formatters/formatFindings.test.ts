import { describe, expect, it } from 'vitest'

import { formatFindings } from '@/report/formatters/formatFindings.js'

describe('formatFindings', () => {
  it('cuts long evidence and points at --json', () => {
    const text = formatFindings([
      {
        rule: 'r',
        severity: 'warning',
        message: 'm',
        evidence: Array.from({ length: 25 }, (_, i) => `line ${String(i)}`),
      },
    ])
    expect(text).toContain('warning r: m')
    expect(text).toContain('  line 19')
    expect(text).not.toContain('line 20')
    expect(text).toContain('... 5 more (--json lists all)')
  })
})
