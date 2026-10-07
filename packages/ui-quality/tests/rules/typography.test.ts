import { describe, expect, it } from 'vitest'

import { letterSpacing } from '@/rules/letterSpacing.js'
import { tightLeading } from '@/rules/tightLeading.js'
import { undersizedText } from '@/rules/undersizedText.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const text = (id: number, overrides: Parameters<typeof elementBox>[0]) =>
  elementBox({
    text: 'Pending invoices',
    textLength: 16,
    signature: `p.t${String(id)}`,
    ...overrides,
  })

const rulesOf = (rule: typeof tightLeading, boxes: ReturnType<typeof text>[]) =>
  rule(snapshotOf(boxes), ruleContext()).map((finding) => finding.subject)

describe('undersizedText', () => {
  it('holds running text to 12px and controls to 11px', () => {
    const cell = elementBox({ id: 0, tag: 'td', signature: 'td' })
    const subjects = rulesOf(undersizedText, [
      cell,
      text(1, { id: 1, parent: 0, fontSize: 11, selector: 'td > span' }),
      text(2, { id: 2, parent: 0, fontSize: 10, selector: 'td > b' }),
      text(3, { id: 3, fontSize: 11, selector: 'p.note' }),
      text(4, { id: 4, fontSize: 12, selector: 'p.body' }),
    ])
    expect(subjects).toEqual(['td > b', 'p.note'])
  })
  it('leaves code, superscripts and elements without text alone', () => {
    const code = elementBox({ id: 0, tag: 'code', signature: 'code' })
    expect(
      rulesOf(undersizedText, [
        code,
        text(1, { id: 1, parent: 0, fontSize: 9 }),
        text(2, { id: 2, tag: 'sup', fontSize: 9 }),
        elementBox({ id: 3, fontSize: 8 }),
      ]),
    ).toEqual([])
  })
})

describe('tightLeading', () => {
  it('reports wrapped body text under 1.3 and accepts display type and one line', () => {
    const subjects = rulesOf(tightLeading, [
      text(0, {
        id: 0,
        lines: 3,
        fontSize: 16,
        lineHeight: 18,
        selector: 'p.tight',
      }),
      text(1, {
        id: 1,
        lines: 3,
        fontSize: 16,
        lineHeight: 24,
        selector: 'p.body',
      }),
      text(2, {
        id: 2,
        lines: 1,
        fontSize: 16,
        lineHeight: 16,
        selector: 'p.one',
      }),
      text(3, {
        id: 3,
        lines: 2,
        fontSize: 30,
        lineHeight: 36,
        selector: 'h1',
      }),
    ])
    expect(subjects).toEqual(['p.tight'])
  })
})

describe('letterSpacing', () => {
  it('reports crowded and spread lower-case text', () => {
    const long = 'Every invoice issued this quarter'
    const subjects = rulesOf(letterSpacing, [
      text(0, { id: 0, fontSize: 32, letterSpacing: -1.6, selector: 'h1' }),
      text(1, {
        id: 1,
        fontSize: 14,
        letterSpacing: -0.35,
        selector: 'p.small',
      }),
      text(2, {
        id: 2,
        fontSize: 16,
        letterSpacing: 1.6,
        text: long,
        textLength: long.length,
        selector: 'p.wide',
      }),
    ])
    expect(subjects).toEqual(['h1', 'p.small', 'p.wide'])
  })
  it('accepts slight tightening on large text and tracked-out capitals or labels', () => {
    const long = 'EVERY INVOICE ISSUED THIS QUARTER'
    expect(
      rulesOf(letterSpacing, [
        text(0, { id: 0, fontSize: 32, letterSpacing: -0.8 }),
        text(1, {
          id: 1,
          fontSize: 12,
          letterSpacing: 1.2,
          text: long,
          textLength: long.length,
        }),
        text(2, {
          id: 2,
          fontSize: 12,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }),
        text(3, { id: 3, fontSize: 12, letterSpacing: 1.2 }),
        elementBox({ id: 4, fontSize: 12, letterSpacing: -2 }),
      ]),
    ).toEqual([])
  })
})
