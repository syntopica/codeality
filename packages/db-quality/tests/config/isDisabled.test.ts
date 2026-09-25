import { describe, expect, it } from 'vitest'

import { isDisabled } from '@/config/isDisabled.js'

describe('isDisabled', () => {
  it('matches on the code only', () => {
    expect(isDisabled('BDB001', [{ code: 'BDB001', reason: 'r' }])).toBe(true)
    expect(isDisabled('BDB002', [{ code: 'BDB001', reason: 'r' }])).toBe(false)
  })
})
