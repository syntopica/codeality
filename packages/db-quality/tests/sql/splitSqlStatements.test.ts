import { describe, expect, it } from 'vitest'

import { splitSqlStatements } from '@/sql/splitSqlStatements.js'

describe('splitSqlStatements', () => {
  it('splits on semicolons and records the first line of each statement', () => {
    expect(
      splitSqlStatements(
        '-- header\ncreate table a (id int);\n\nalter table a\n  enable row level security;',
      ),
    ).toEqual([
      { text: 'create table a (id int)', line: 2 },
      { text: 'alter table a\n  enable row level security', line: 4 },
    ])
  })
  it('does not split inside dollar-quoted bodies, strings or quoted identifiers', () => {
    const sql = `create function f() returns void as $body$ begin perform 1; end; $body$ language plpgsql;\nselect ';';\ncreate table "a;b" (x int);`
    expect(splitSqlStatements(sql).map((s) => s.line)).toEqual([1, 2, 3])
  })
  it('ignores a trailing fragment without a semicolon that is blank', () => {
    expect(splitSqlStatements('select 1;\n  \n')).toHaveLength(1)
  })
  it('keeps a trailing statement that has no semicolon', () => {
    expect(splitSqlStatements('select 1;\nselect 2')).toHaveLength(2)
  })
})
