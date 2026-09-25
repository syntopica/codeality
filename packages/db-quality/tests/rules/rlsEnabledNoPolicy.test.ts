import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { rlsEnabledNoPolicy } from '@/rules/rlsEnabledNoPolicy.js'
import { migrationSetFrom } from '@tests/rules/migrationSetFrom.js'

const read = (name: string): string =>
  readFileSync(
    new URL(`../fixtures/migrations/${name}`, import.meta.url),
    'utf8',
  )
const set = migrationSetFrom({
  'm/a.sql': read('rls_set_a.sql'),
  'm/b.sql': read('rls_set_b.sql'),
})

describe('rlsEnabledNoPolicy', () => {
  it('reports the table whose RLS is on with no policy anywhere in the set', () => {
    expect(
      rlsEnabledNoPolicy
        .run(set)
        .map((f) => [f.path, f.line, f.subject, f.severity]),
    ).toEqual([['m/a.sql', 5, 'public.service_only', 'info']])
  })
})
