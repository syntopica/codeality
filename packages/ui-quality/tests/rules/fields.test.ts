import { isTimestampText } from '@/rules/isTimestampText.js'
import { placeholderAsLabel } from '@/rules/placeholderAsLabel.js'
import { timeWithoutDatetime } from '@/rules/timeWithoutDatetime.js'
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

describe('placeholderAsLabel', () => {
  const field = (overrides = {}) =>
    elementBox({
      id: 0,
      tag: 'input',
      isControl: true,
      placeholder: true,
      inputType: 'text',
      x: 100,
      y: 300,
      width: 280,
      height: 40,
      ...overrides,
    })
  it('reports a field named only by its placeholder', () => {
    expect(
      placeholderAsLabel(snapshotOf([field()]), ruleContext()),
    ).toHaveLength(1)
  })
  it('accepts a visible label, a caption nearby, a search box and typeless inputs', () => {
    expect(
      placeholderAsLabel(
        snapshotOf([field({ visibleLabel: true })]),
        ruleContext(),
      ),
    ).toEqual([])
    const caption = worded('Full name', {
      id: 1,
      x: 100,
      y: 270,
      width: 100,
      height: 24,
    })
    expect(
      placeholderAsLabel(snapshotOf([field(), caption]), ruleContext()),
    ).toEqual([])
    const beside = worded('Name', {
      id: 1,
      x: 20,
      y: 305,
      width: 60,
      height: 24,
    })
    expect(
      placeholderAsLabel(snapshotOf([field(), beside]), ruleContext()),
    ).toEqual([])
    expect(
      placeholderAsLabel(
        snapshotOf([field({ inputType: 'search' })]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      placeholderAsLabel(
        snapshotOf([field({ role: 'searchbox' })]),
        ruleContext(),
      ),
    ).toEqual([])
    const search = elementBox({ id: 0, role: 'search' })
    expect(
      placeholderAsLabel(
        snapshotOf([search, field({ id: 1, parent: 0 })]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      placeholderAsLabel(
        snapshotOf([field({ placeholder: false })]),
        ruleContext(),
      ),
    ).toEqual([])
  })
  it('does not count text far above the field as its caption', () => {
    const far = worded('Profile', {
      id: 1,
      x: 100,
      y: 100,
      width: 100,
      height: 24,
    })
    expect(
      placeholderAsLabel(snapshotOf([field(), far]), ruleContext()),
    ).toHaveLength(1)
  })
})

describe('timeWithoutDatetime', () => {
  const cell = elementBox({ id: 0, tag: 'td' })
  const stamp = (text: string, overrides = {}) =>
    worded(text, { id: 1, parent: 0, tag: 'span', ...overrides })
  it('recognises relative times and dates as the whole text', () => {
    for (const text of [
      '5 min ago',
      '3h',
      'hace 3 horas',
      '2026-10-07',
      'Oct 7, 2026',
      'just now',
    ])
      expect(isTimestampText(text)).toBe(true)
    for (const text of [
      'Invoice sent',
      'Back in 5 minutes if the queue is quiet again soon',
      '42',
    ])
      expect(isTimestampText(text)).toBe(false)
  })
  it('reports a timestamp in a cell with no time element and no title', () => {
    expect(
      timeWithoutDatetime(
        snapshotOf([cell, stamp('5 min ago')]),
        ruleContext(),
      ),
    ).toHaveLength(1)
  })
  it('accepts a time element, a title, text outside rows and sentences', () => {
    expect(
      timeWithoutDatetime(
        snapshotOf([cell, stamp('5 min ago', { tag: 'time', datetime: true })]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      timeWithoutDatetime(
        snapshotOf([cell, stamp('5 min ago', { hasTitle: true })]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      timeWithoutDatetime(
        snapshotOf([worded('5 min ago', { tag: 'p' })]),
        ruleContext(),
      ),
    ).toEqual([])
  })
})
