import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { permissivePolicy } from '@/rules/permissivePolicy.js'
import { migrationSetFrom } from '@tests/rules/migrationSetFrom.js'

const set = migrationSetFrom({
  'm/permissive.sql': readFileSync(
    new URL('../fixtures/migrations/permissive.sql', import.meta.url),
    'utf8',
  ),
})

describe('permissivePolicy', () => {
  it('flags using (true) and with check (true), not a real predicate', () => {
    const findings = permissivePolicy.run(set)
    expect(findings.map((f) => [f.line, f.subject])).toEqual([
      [1, 'public.profiles'],
      [2, 'public.chat_profiles'],
    ])
    expect(findings[0]).toMatchObject({
      code: 'BDB001',
      severity: 'warn',
      path: 'm/permissive.sql',
    })
    expect(findings[0]?.fingerprint).toMatch(/^[0-9a-f]{16}$/)
  })
})
