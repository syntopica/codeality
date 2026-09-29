import { describe, expect, it } from 'vitest'

import { commaListMembership } from '@/adapters/sqlite/commaListMembership.js'
import { migrationSetFrom } from '@tests/rules/migrationSetFrom.js'

describe('commaListMembership', () => {
  it('flags instr() over a comma-joined parameter', () => {
    const set = migrationSetFrom({
      'jobs_list.sql': [
        'SELECT id FROM jobs',
        "WHERE instr(',' || ?1 || ',', ',' || state || ',') > 0;",
        "SELECT id FROM t WHERE INSTR( ','||:kinds||',' , ','||kind||',');",
      ].join('\n'),
    })
    const findings = commaListMembership.run(set)
    expect(findings.map((f) => [f.code, f.line, f.subject])).toEqual([
      ['BDB405', 2, '?1'],
      ['BDB405', 3, ':kinds'],
    ])
    expect(findings[0]?.message).toMatch(
      /IN \(SELECT value FROM json_each\(\?1\)\)/,
    )
  })
  it('accepts instr() on a column and the json_each form', () => {
    const set = migrationSetFrom({
      'q.sql': [
        'SELECT id FROM t WHERE instr(name, ?1) > 0;',
        "SELECT id FROM t WHERE instr(',' || tags || ',', ',a,') > 0;",
        'SELECT id FROM t WHERE state IN (SELECT value FROM json_each(?1));',
      ].join('\n'),
    })
    expect(commaListMembership.run(set)).toEqual([])
  })
})
