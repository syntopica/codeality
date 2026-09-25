import { describe, expect, it } from 'vitest'

import { renderFindings } from '@/check/renderFindings.js'
import { renderFindingsJson } from '@/check/renderFindingsJson.js'

const finding = {
  code: 'BDB001',
  severity: 'warn' as const,
  path: 'm/a.sql',
  line: 3,
  message: 'policy is permissive',
  subject: 'public.t',
  fingerprint: 'abcd',
}

describe('renderFindings', () => {
  it('prints one line per finding and a count', () => {
    expect(renderFindings([finding])).toBe(
      'm/a.sql:3: BDB001 policy is permissive (public.t)\n1 findings',
    )
    expect(renderFindings([{ ...finding, subject: '' }])).toBe(
      'm/a.sql:3: BDB001 policy is permissive\n1 findings',
    )
    expect(renderFindings([])).toBe('0 findings')
  })
  it('renders the JSON document', () => {
    expect(JSON.parse(renderFindingsJson([finding]))).toEqual({
      schemaVersion: 1,
      findings: [finding],
    })
  })
})
