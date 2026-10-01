import { describe, expect, it } from 'vitest'

import { textHardCut } from '@/rules/textHardCut.js'
import { rows } from '@tests/rows.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const cut = (text: string): string => text.padEnd(40, 'x')

describe('textHardCut', () => {
  it('reports texts that tie at the longest length with no ellipsis', () => {
    const table = [cut('first'), cut('second'), 'short one'].map((text) => [
      { x: 0, text },
    ])
    const findings = textHardCut(snapshotOf(rows(table)), ruleContext())
    expect(findings).toHaveLength(1)
    expect(findings[0]?.message).toContain(
      '2 texts in this column stop at exactly 40 characters',
    )
  })
  it('accepts an ellipsis, a single longest text and short texts', () => {
    const dotted = [
      `${cut('a').slice(0, 39)}…`,
      `${cut('b').slice(0, 39)}…`,
      'c',
    ].map((text) => [{ x: 0, text }])
    expect(textHardCut(snapshotOf(rows(dotted)), ruleContext())).toEqual([])
    const natural = [cut('a'), `${cut('b')}yy`, 'c'].map((text) => [
      { x: 0, text },
    ])
    expect(textHardCut(snapshotOf(rows(natural)), ruleContext())).toEqual([])
    const short = ['same len', 'same len', 'x'].map((text) => [{ x: 0, text }])
    expect(textHardCut(snapshotOf(rows(short)), ruleContext())).toEqual([])
  })
})
