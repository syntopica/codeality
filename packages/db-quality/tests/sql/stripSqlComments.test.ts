import { describe, expect, it } from 'vitest'

import { stripSqlComments } from '@/sql/stripSqlComments.js'

describe('stripSqlComments', () => {
  it('removes line and block comments but keeps newlines', () => {
    expect(
      stripSqlComments('select 1; -- one\n/* two\nlines */ select 2;'),
    ).toBe('select 1; \n\n select 2;')
  })
  it('leaves comment markers inside strings and dollar bodies alone', () => {
    const sql =
      "select '--not'; create function f() returns void as $$ -- keep\n/* keep */ $$ language sql;"
    expect(stripSqlComments(sql)).toBe(sql)
  })
  it('runs an unterminated comment, string or body to the end', () => {
    expect(stripSqlComments('select 1 /* open\n')).toBe('select 1 \n')
    expect(stripSqlComments("select 'open")).toBe("select 'open")
    expect(stripSqlComments('do $$ open')).toBe('do $$ open')
    expect(stripSqlComments('select 1 -- open')).toBe('select 1 ')
  })
})
