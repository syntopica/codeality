import { describe, expect, it } from 'vitest'

import { runSqlRules } from '@/rules/runSqlRules.js'
import { migrationSetFrom } from '@tests/rules/migrationSetFrom.js'

const set = migrationSetFrom({
  'm.sql':
    'create table public.t (id int);\ncreate policy "p" on public.t using (true);',
})

describe('runSqlRules', () => {
  it('runs every rule and sorts by path, line, code', () => {
    expect(runSqlRules(set, []).map((f) => f.code)).toEqual([
      'BDB003',
      'BDB001',
    ])
  })
  it('honours the disable list', () => {
    expect(
      runSqlRules(set, [{ code: 'BDB003', reason: 'test' }]).map((f) => f.code),
    ).toEqual(['BDB001'])
  })
})
