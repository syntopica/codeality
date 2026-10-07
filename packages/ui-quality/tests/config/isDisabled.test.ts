import { describe, expect, it } from 'vitest'

import { isDisabled } from '@/config/isDisabled.js'
import type { Finding } from '@/model/Finding.js'

describe('isDisabled', () => {
  it('matches disable entries by rule, route, selector and message', () => {
    const finding = {
      rule: 'palette',
      route: '/a',
      subject: 'div.vendor > span',
      message: 'off-palette colour #123456',
    } as Finding
    const entry = {
      rule: 'palette',
      route: null,
      selector: '.vendor',
      message: null,
      reason: 'r',
    }
    expect(isDisabled(finding, [entry])).toBe(true)
    expect(isDisabled(finding, [{ ...entry, route: '/b' }])).toBe(false)
    expect(isDisabled(finding, [{ ...entry, rule: '*', selector: null }])).toBe(
      true,
    )
    expect(isDisabled(finding, [{ ...entry, selector: '.mine' }])).toBe(false)
    expect(isDisabled(finding, [{ ...entry, message: '#123456' }])).toBe(true)
    expect(isDisabled(finding, [{ ...entry, message: '#654321' }])).toBe(false)
  })
})
