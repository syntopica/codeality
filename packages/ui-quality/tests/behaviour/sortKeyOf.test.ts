import { describe, expect, it } from 'vitest'

import { sortKeyOf } from '@/behaviour/sortKeyOf.js'

describe('sortKeyOf', () => {
  it('reads dates, amounts in either locale and empty cells', () => {
    expect(sortKeyOf('19/09/2026')).toBe(20260919)
    expect(sortKeyOf('2026-09-19')).toBe(20260919)
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
})
