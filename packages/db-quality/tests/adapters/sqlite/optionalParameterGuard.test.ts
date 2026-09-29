import { describe, expect, it } from 'vitest'

import { optionalParameterGuard } from '@/adapters/sqlite/optionalParameterGuard.js'
import { migrationSetFrom } from '@tests/rules/migrationSetFrom.js'

describe('optionalParameterGuard', () => {
  it('flags every parameter spelling on the line of the guard', () => {
    const set = migrationSetFrom({
      'jobs_list.sql': [
        '-- optional state filter',
        'SELECT id FROM jobs',
        "WHERE (?1 IS NULL OR instr(',' || ?1 || ',', ',' || state || ',') > 0);",
        'SELECT id FROM jobs WHERE :state is null or state = :state;',
        'SELECT id FROM jobs WHERE (state = @s OR @s IS NULL);',
        'SELECT id FROM jobs WHERE $kind IS NULL OR kind = $kind;',
        'SELECT id FROM jobs WHERE ? IS NULL OR kind = ?;',
      ].join('\n'),
    })
    expect(
      optionalParameterGuard.run(set).map((f) => [f.line, f.subject]),
    ).toEqual([
      [3, '?1'],
      [4, ':state'],
      [5, '@s'],
      [6, '$kind'],
      [7, '?'],
    ])
    expect(optionalParameterGuard.run(set)[0]).toMatchObject({
      code: 'BDB404',
      severity: 'warn',
      path: 'jobs_list.sql',
    })
  })
  it('accepts a plain filter, a column null test and a guard in a comment', () => {
    const set = migrationSetFrom({
      'q.sql': [
        '-- was: ?1 IS NULL OR state = ?1',
        'SELECT id FROM jobs WHERE state IN (SELECT value FROM json_each(?1));',
        'SELECT id FROM jobs WHERE finished_at IS NULL OR state = ?1;',
        'SELECT CASE WHEN ?1 IS NULL THEN 0 ELSE 1 END;',
      ].join('\n'),
    })
    expect(optionalParameterGuard.run(set)).toEqual([])
  })
})
