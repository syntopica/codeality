import { describe, expect, it } from 'vitest'

import { groupGapRatio } from '@/rules/groupGapRatio.js'
import { headingRhythm } from '@/rules/headingRhythm.js'
import { isOffScaleSpacing } from '@/rules/isOffScaleSpacing.js'
import { offScaleSpacing } from '@/rules/offScaleSpacing.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const main = elementBox({ id: 0, tag: 'main', isMain: true, selector: 'main' })

describe('isOffScaleSpacing', () => {
  it('accepts multiples of 4, hairlines, a border neighbour and em fractions', () => {
    expect(isOffScaleSpacing(8, false)).toBe(false)
    expect(isOffScaleSpacing(2, false)).toBe(false)
    expect(isOffScaleSpacing(3, true)).toBe(false)
    expect(isOffScaleSpacing(21.44, false)).toBe(false)
  })
  it('rejects 3px without a border and values between steps', () => {
    expect(isOffScaleSpacing(3, false)).toBe(true)
    expect(isOffScaleSpacing(6, false)).toBe(true)
    expect(isOffScaleSpacing(14, true)).toBe(true)
  })
})

describe('offScaleSpacing', () => {
  const padded = (id: number, padding: number, overrides = {}) =>
    elementBox({
      id,
      parent: 0,
      padding: [padding, padding, padding, padding],
      ...overrides,
    })
  it('reports three distinct off-scale values in main, once', () => {
    const findings = offScaleSpacing(
      snapshotOf([main, padded(1, 6), padded(2, 10), padded(3, 14)]),
      ruleContext(),
    )
    expect(findings).toHaveLength(1)
    expect(findings[0]?.message).toContain('6, 10, 14px')
  })
  it('needs three distinct values, inside main, outside authored content', () => {
    expect(
      offScaleSpacing(
        snapshotOf([main, padded(1, 6), padded(2, 10), padded(3, 6)]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      offScaleSpacing(
        snapshotOf([
          main,
          padded(1, 6),
          padded(2, 10),
          elementBox({ id: 3, padding: [14, 14, 14, 14] }),
        ]),
        ruleContext(),
      ),
    ).toEqual([])
    const article = padded(1, 0, { tag: 'article' })
    expect(
      offScaleSpacing(
        snapshotOf([
          main,
          article,
          padded(2, 6, { parent: 1 }),
          padded(3, 10, { parent: 1 }),
          padded(4, 14, { parent: 1 }),
        ]),
        ruleContext(),
      ),
    ).toEqual([])
  })
  it('counts vertical margins and gaps but not horizontal margins or a default button', () => {
    const margins = elementBox({
      id: 1,
      parent: 0,
      margin: [6, 99, 10, 99],
      gap: [14, 0],
    })
    expect(
      offScaleSpacing(snapshotOf([main, margins]), ruleContext()),
    ).toHaveLength(1)
    const button = elementBox({
      id: 2,
      parent: 0,
      tag: 'button',
      padding: [1, 6, 1, 6],
    })
    expect(
      offScaleSpacing(
        snapshotOf([main, button, padded(3, 10), padded(4, 14)]),
        ruleContext(),
      ),
    ).toEqual([])
  })
})

describe('headingRhythm', () => {
  const block = (id: number, y: number, tag = 'p') =>
    elementBox({
      id,
      parent: 0,
      tag,
      y,
      height: 24,
      selector: `${tag}${String(id)}`,
    })
  it('reports headings with no more space above than below, from two of them', () => {
    const findings = headingRhythm(
      snapshotOf([
        main,
        block(1, 0),
        block(2, 32, 'h2'),
        block(3, 80),
        block(4, 112, 'h2'),
        block(5, 160),
      ]),
      ruleContext(),
    )
    expect(findings.map((finding) => finding.subject)).toEqual(['h22', 'h24'])
  })
  it('accepts a heading closer to what follows, and a single loose one', () => {
    expect(
      headingRhythm(
        snapshotOf([
          main,
          block(1, 0),
          block(2, 56, 'h2'),
          block(3, 88),
          block(4, 160, 'h2'),
          block(5, 192),
        ]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      headingRhythm(
        snapshotOf([
          main,
          block(1, 0),
          block(2, 32, 'h2'),
          block(3, 80),
          block(4, 160),
        ]),
        ruleContext(),
      ),
    ).toEqual([])
  })
  it('skips a heading first or last in its parent or beside another block', () => {
    expect(
      headingRhythm(
        snapshotOf([
          main,
          block(1, 0, 'h2'),
          block(2, 40),
          block(3, 100, 'h2'),
          { ...block(4, 100), x: 400 },
        ]),
        ruleContext(),
      ),
    ).toEqual([])
  })
})

describe('groupGapRatio', () => {
  const form = elementBox({ id: 0, tag: 'form', selector: 'form' })
  const field = (id: number, y: number, gap: number) => [
    elementBox({
      id,
      parent: 0,
      tag: 'label',
      text: 'Name',
      y,
      height: 20,
      selector: `label${String(id)}`,
    }),
    elementBox({
      id: id + 1,
      parent: 0,
      tag: 'input',
      isControl: true,
      y: y + 20 + gap,
      height: 40,
    }),
  ]
  it('reports a form whose groups are no farther apart than a label is from its field', () => {
    const findings = groupGapRatio(
      snapshotOf([form, ...field(1, 0, 12), ...field(3, 84, 12)]),
      ruleContext(),
    )
    expect(findings.map((finding) => finding.subject)).toEqual(['form'])
  })
  it('accepts tight labels over wide gaps, and a form with one group', () => {
    expect(
      groupGapRatio(
        snapshotOf([form, ...field(1, 0, 4), ...field(3, 84, 4)]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      groupGapRatio(snapshotOf([form, ...field(1, 0, 12)]), ruleContext()),
    ).toEqual([])
  })
})
