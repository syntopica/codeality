import { describe, expect, it } from 'vitest'

import { dollarTag } from '@/postgres/dollarTag.js'
import { explainDoBlock } from '@/postgres/explainDoBlock.js'

describe('explainDoBlock', () => {
  it('passes the statement to EXECUTE as a dollar-quoted literal and keeps the plan in a session setting', () => {
    const sql = "select 'it''s', $$a;b$$"
    const block = explainDoBlock(sql)
    const match =
      /^do \$(dbq_[0-9a-f]{16})\$ declare p text; begin execute 'explain \(analyze, buffers, format json\) ' \|\| \$(dbq_[0-9a-f]{16})\$(.*)\$\2\$ into p; perform set_config\('dbq\.plan', p, false\); end \$\1\$$/s.exec(
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
