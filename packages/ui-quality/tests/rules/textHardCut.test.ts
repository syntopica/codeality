import { describe, expect, it } from 'vitest'

import type { ElementBox } from '@/model/ElementBox.js'
import { textHardCut } from '@/rules/textHardCut.js'
import { elementBox } from '@tests/elementBox.js'
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
  it('reports a spike of cut texts hidden by a longer text from another source', () => {
    const table = [
      ...Array.from({ length: 6 }, (_, index) => cut(`row ${String(index)}`)),
      'a subject line that is longer than every cut preview in the column',
      'short',
    ].map((text) => [{ x: 0, text }])
    const findings = textHardCut(snapshotOf(rows(table)), ruleContext())
    expect(findings[0]?.message).toContain(
      '6 texts in this column stop at exactly 40 characters',
    )
  })
  it('accepts natural lengths that repeat no more than their neighbours', () => {
    const table = [40, 40, 40, 40, 40, 41, 41, 42, 42, 70].map(
      (length, index) => [{ x: 0, text: String(index).padEnd(length, 'y') }],
    )
    expect(textHardCut(snapshotOf(rows(table)), ruleContext())).toEqual([])
  })
  it('reads texts nested below the single wrapper of a row', () => {
    const elements: ElementBox[] = [elementBox({ id: 0, tag: 'ul' })]
    ;[cut('one'), cut('two'), 'short'].forEach((text, row) => {
      const id = elements.length
      const y = row * 40
      elements.push(
        elementBox({ id, parent: 0, tag: 'li', signature: 'li', y }),
        elementBox({ id: id + 1, parent: id, tag: 'a', y }),
        elementBox({ id: id + 2, parent: id + 1, tag: 'svg', y }),
        elementBox({ id: id + 3, parent: id + 1, y }),
        elementBox({ id: id + 4, parent: id + 3, text: 'Sender', y }),
        elementBox({ id: id + 5, parent: id + 3, y }),
        elementBox({
          id: id + 6,
          parent: id + 5,
          text,
          textLength: text.length,
          textTail: text.slice(-3),
          y,
        }),
      )
    })
    expect(textHardCut(snapshotOf(elements), ruleContext())).toHaveLength(1)
  })
  it('accepts two natural texts tying at the longest length in a long column', () => {
    const table = Array.from({ length: 200 }, (_, index) => [
      { x: 0, text: String(index).padEnd(10 + (index % 20), 'n') },
    ])
    table.push(
      [{ x: 0, text: cut('first name') }],
      [{ x: 0, text: cut('second') }],
    )
    expect(textHardCut(snapshotOf(rows(table)), ruleContext())).toEqual([])
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
