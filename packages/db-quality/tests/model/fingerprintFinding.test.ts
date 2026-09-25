import { describe, expect, it } from 'vitest'

import { fingerprintFinding } from '@/model/fingerprintFinding.js'

const base = {
  code: 'BDB001',
  severity: 'warn' as const,
  path: 'supabase/migrations/a.sql',
  message: 'm',
  subject: 'public.t',
}

describe('fingerprintFinding', () => {
  it('is 16 hex characters', () => {
    expect(fingerprintFinding({ ...base, line: 3 }, 'create policy x')).toMatch(
      /^[0-9a-f]{16}$/,
    )
  })
  it('ignores the line number', () => {
    expect(fingerprintFinding({ ...base, line: 3 }, 'ctx')).toBe(
      fingerprintFinding({ ...base, line: 30 }, 'ctx'),
    )
  })
  it('changes with the context, the code and the path', () => {
    const one = fingerprintFinding({ ...base, line: 1 }, 'ctx')
    expect(fingerprintFinding({ ...base, line: 1 }, 'other')).not.toBe(one)
    expect(
      fingerprintFinding({ ...base, code: 'BDB002', line: 1 }, 'ctx'),
    ).not.toBe(one)
    expect(
      fingerprintFinding({ ...base, path: 'b.sql', line: 1 }, 'ctx'),
    ).not.toBe(one)
  })
})
