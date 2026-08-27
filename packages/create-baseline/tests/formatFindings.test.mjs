import { describe, expect, it } from 'vitest'

import { formatFindings } from '../bin/conformance/formatFindings.mjs'

describe('formatFindings', () => {
  it('leads with the id, which is what goes into the exceptions file', () => {
    const out = formatFindings({
      findings: [
        {
          id: 'gate:knip',
          level: 'error',
          message: 'never invoked',
          detail: 'why',
        },
      ],
      waived: [],
    })
    expect(out).toContain('FAIL  gate:knip  never invoked')
    expect(out).toContain('why')
  })

  it('marks what --fix can repair', () => {
    const out = formatFindings({
      findings: [
        { id: 'x', level: 'error', message: 'm', fix: { kind: 'set-script' } },
      ],
      waived: [],
    })
    expect(out).toContain('--fix')
  })

  it('lists waivers with their reason and expiry', () => {
    const out = formatFindings({
      findings: [],
      waived: [
        {
          id: 'gate:dupes',
          level: 'error',
          message: 'never invoked',
          waiver: { reason: 'generated code', expires: '2026-12-31' },
        },
      ],
    })
    expect(out).toContain('expires 2026-12-31')
    expect(out).toContain('generated code')
  })
})
