import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { parseSquawkReport } from '@/adapters/squawk/parseSquawkReport.js'

const stdout = readFileSync(
  new URL('../../fixtures/reports/squawk.json', import.meta.url),
  'utf8',
)
const set = [
  {
    path: 'supabase/migrations/20260508000000_initial_schema.sql',
    statements: [{ text: 'create table public.a (id serial)', line: 47 }],
  },
]

describe('parseSquawkReport', () => {
  it('maps entries to BDB100 findings with the statement as fingerprint context', () => {
    const findings = parseSquawkReport(stdout, set, [])
    expect(findings).toHaveLength(2)
    expect(findings[0]).toMatchObject({
      code: 'BDB100/prefer-bigint-over-int',
      severity: 'warn',
      line: 47,
      subject: 'prefer-bigint-over-int',
    })
  })
  it('uses the message as context when no statement covers the line', () => {
    const [first] = parseSquawkReport(stdout, set, [])
    const [bare] = parseSquawkReport(stdout, [], [])
    expect(bare?.fingerprint).not.toBe(first?.fingerprint)
  })
  it('drops disabled codes', () => {
    expect(
      parseSquawkReport(stdout, set, [
        { code: 'BDB100/prefer-bigint-over-int', reason: 'test' },
      ]),
    ).toEqual([])
  })
  it('treats empty output as no findings and rejects non-JSON', () => {
    expect(parseSquawkReport('  \n', set, [])).toEqual([])
    expect(() => parseSquawkReport('error: boom', set, [])).toThrow(
      /no JSON report/,
    )
  })
})
