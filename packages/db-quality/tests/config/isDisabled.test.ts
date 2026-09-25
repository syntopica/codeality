import { describe, expect, it } from 'vitest'

import { isDisabled } from '@/config/isDisabled.js'

describe('isDisabled', () => {
  it('matches the exact code only', () => {
    expect(
      isDisabled('BDB100/prefer-bigint-over-int', [
        'BDB100/prefer-bigint-over-int',
      ]),
    ).toBe(true)
    expect(isDisabled('BDB100/prefer-bigint-over-int', ['BDB100'])).toBe(false)
  })
})
