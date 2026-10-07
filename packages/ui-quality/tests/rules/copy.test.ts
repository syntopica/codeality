import { asciiEllipsis } from '@/rules/asciiEllipsis.js'
import { labelPunctuation } from '@/rules/labelPunctuation.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { describe, expect, it } from 'vitest'

const worded = (text: string, overrides = {}) =>
  elementBox({
    id: 0,
    text,
    textLength: text.length,
    textTail: text.slice(-3),
    ...overrides,
  })

describe('asciiEllipsis', () => {
  it('reports three full stops closing a word or the text', () => {
    expect(
      asciiEllipsis(snapshotOf([worded('Loading...')]), ruleContext()),
    ).toHaveLength(1)
    expect(
      asciiEllipsis(snapshotOf([worded('Wait...for it')]), ruleContext()),
    ).toHaveLength(1)
  })
  it('accepts the single character, code and plain sentences', () => {
    expect(
      asciiEllipsis(snapshotOf([worded('Loading…')]), ruleContext()),
    ).toEqual([])
    expect(asciiEllipsis(snapshotOf([worded('Done.')]), ruleContext())).toEqual(
      [],
    )
    const code = elementBox({ id: 0, tag: 'code' })
    expect(
      asciiEllipsis(
        snapshotOf([code, worded('a...', { id: 1, parent: 0 })]),
        ruleContext(),
      ),
    ).toEqual([])
  })
})

describe('labelPunctuation', () => {
  const label = (text: string, overrides = {}) =>
    worded(text, { tag: 'label', ...overrides })
  const on = ruleContext({ enabled: ['label-punctuation'] })
  it('is off unless the project enables it', () => {
    expect(
      labelPunctuation(snapshotOf([label('Name:')]), ruleContext()),
    ).toEqual([])
  })
  it('reports a trailing colon and an asterisk, in the label or in a child of it', () => {
    expect(labelPunctuation(snapshotOf([label('Name:')]), on)).toHaveLength(1)
    expect(labelPunctuation(snapshotOf([label('Email *')]), on)).toHaveLength(1)
    const star = worded('*', { id: 1, parent: 0, tag: 'span' })
    expect(
      labelPunctuation(snapshotOf([label('Email', { id: 0 }), star]), on),
    ).toHaveLength(1)
  })
  it('accepts plain labels and an asterisk elsewhere', () => {
    expect(labelPunctuation(snapshotOf([label('Name')]), on)).toEqual([])
    expect(
      labelPunctuation(snapshotOf([worded('5 * 3', { tag: 'p' })]), on),
    ).toEqual([])
  })
})
