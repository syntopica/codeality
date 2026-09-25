import { describe, expect, it } from 'vitest'

import { dollarTag } from '@/postgres/dollarTag.js'
import { explainDoBlock } from '@/postgres/explainDoBlock.js'

describe('explainDoBlock', () => {
  it('opens a cursor over the statement as a dollar-quoted literal, rolls it back, refuses a missing plan, and keeps the plan in a session setting', () => {
    const sql = "select 'it''s', $$a;b$$"
    const block = explainDoBlock(sql)
    const match =
      /^do \$(dbq_[0-9a-f]{16})\$ declare c refcursor; p text; begin begin open c for execute 'explain \(analyze, buffers, format json\) ' \|\| \$(dbq_[0-9a-f]{16})\$(.*)\$\2\$; fetch c into p; close c; raise exception using errcode = 'DBQRB'; exception when sqlstate 'DBQRB' then null; end; if p is null then raise exception 'the statement produced no plan'; end if; perform set_config\('dbq\.plan', p, false\); end \$\1\$$/s.exec(
        block,
      )
    expect(match?.[3]).toBe(sql)
    expect(match?.[1]).not.toBe(match?.[2])
  })
})

describe('dollarTag', () => {
  it('draws again while the tag appears in the text it must quote', () => {
    const draws = ['aa', 'aa', 'bb']
    const next = (): string => draws.shift() ?? 'zz'
    expect(dollarTag('select $dbq_aa$x$dbq_aa$', next)).toBe('dbq_bb')
  })
  it('draws random hex by default', () => {
    expect(dollarTag('select 1')).toMatch(/^dbq_[0-9a-f]{16}$/)
  })
})
