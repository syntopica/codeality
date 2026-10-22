import { describe, expect, it } from 'vitest'

import { columnOrderOf } from '@/behaviour/columnOrderOf.js'
import { sortKeyOf } from '@/behaviour/sortKeyOf.js'

describe('sortKeyOf', () => {
  it('reads dates, amounts in either locale and empty cells', () => {
    expect(sortKeyOf('19/09/2026')).toBe(20260919)
    expect(sortKeyOf('2026-09-19')).toBe(20260919)
    expect(sortKeyOf('2026-09')).toBe(20260900)
    expect(sortKeyOf('2.359,50 €')).toBe(2359.5)
    expect(sortKeyOf('18,00 US$')).toBe(18)
    expect(sortKeyOf('$1,234.56')).toBe(1234.56)
    expect(sortKeyOf('1.234')).toBe(1234)
    expect(sortKeyOf('-12,5 %')).toBe(-12.5)
    expect(sortKeyOf(' — ')).toBeNull()
  })
  it('keeps text that merely contains digits as text', () => {
    expect(sortKeyOf('#F260477627')).toBe('#F260477627')
    expect(sortKeyOf('Vibra Lab S.L.')).toBe('Vibra Lab S.L.')
    expect(sortKeyOf('B66543778')).toBe('B66543778')
  })
  it.each(['\n', '\r\n', '\u2028', '\u2029'])(
    'keeps separate numeric lines as text for separator %j',
    (separator) => {
      expect(sortKeyOf(`1${separator}2026`)).toBe('1 2026')
    },
  )
  it('preserves horizontal grouping in a single amount', () => {
    expect(sortKeyOf('1 234,50 €')).toBe(1234.5)
    expect(sortKeyOf('1\u00a0234,50 €')).toBe(1234.5)
    expect(sortKeyOf('1\u202f234,50 €')).toBe(1234.5)
    expect(sortKeyOf('  1\t234,50 €  ')).toBe(1234.5)
  })
  it('orders counts with secondary year lists without concatenating their digits', () => {
    const cells = ['1\n2026', '2\n2024, 2025', '10\n2017, 2018, 2019']
    expect(columnOrderOf(cells.map(sortKeyOf))).toBe('asc')
    expect(columnOrderOf(cells.toReversed().map(sortKeyOf))).toBe('desc')
  })
  it('keeps a single amount numeric when its currency or unit is on another line', () => {
    const amounts = ['-2\n€', '-1\n€', '0\n€']
    const percentages = ['1,05\n%', '1,25\n%', '1,5\n%']
    expect(amounts.map(sortKeyOf)).toEqual([-2, -1, 0])
    expect(percentages.map(sortKeyOf)).toEqual([1.05, 1.25, 1.5])
    expect(columnOrderOf(amounts.map(sortKeyOf))).toBe('asc')
    expect(columnOrderOf(percentages.map(sortKeyOf))).toBe('asc')
    expect(sortKeyOf('USD\n1 234,50')).toBe(1234.5)
    expect(sortKeyOf('USD \n\n 1 234,50')).toBe(1234.5)
  })
})
