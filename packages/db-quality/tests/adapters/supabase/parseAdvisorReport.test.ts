import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { parseAdvisorReport } from '@/adapters/supabase/parseAdvisorReport.js'

const stdout = readFileSync(
  new URL('../../fixtures/reports/advisors.json', import.meta.url),
  'utf8',
)

describe('parseAdvisorReport', () => {
  it('maps results to BDB500 findings with the splinter name', () => {
    const findings = parseAdvisorReport(stdout, [])
    expect(findings).toHaveLength(3)
    expect(findings[0]).toMatchObject({
      code: 'BDB500/security_definer_view',
      severity: 'error',
      path: 'supabase',
      line: 0,
      subject: 'public.example_view',
    })
    expect(findings[0]?.message).not.toContain('\\`')
    expect(findings[1]?.severity).toBe('warn')
  })
  it('leaves the subject empty without metadata', () => {
    const bare =
      '{"results":[{"name":"auth_otp_long_expiry","title":"t","level":"INFO","detail":"d"}]}'
    expect(parseAdvisorReport(bare, [])[0]).toMatchObject({
      severity: 'warn',
      subject: '',
    })
  })
  it('drops disabled codes', () => {
    expect(
      parseAdvisorReport(stdout, [
        { code: 'BDB500/security_definer_view', reason: 'test' },
      ]).map((f) => f.code),
    ).not.toContain('BDB500/security_definer_view')
  })
})
