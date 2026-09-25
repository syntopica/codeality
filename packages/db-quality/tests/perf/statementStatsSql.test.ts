import { describe, expect, it } from 'vitest'

import { statementStatsSql } from '@/perf/statementStatsSql.js'

describe('statementStatsSql', () => {
  const sql = statementStatsSql(['authenticated', 'anon'])
  it('keeps plannable DML only, so no utility statement text is ever stored', () => {
    expect(sql).toContain(
      String.raw`s.query ~* '^\s*(select|with|insert|update|delete|merge|values|table)\y'`,
    )
    expect(sql).toContain(String.raw`s.query !~* '^\s*explain'`)
  })
  it('names the application roles', () => {
    expect(sql).toContain("r.rolname in ('authenticated', 'anon')")
  })
})
