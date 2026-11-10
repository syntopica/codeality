import { describe, expect, it } from 'vitest'

import { isDisabled } from '@/config/isDisabled.js'

const DRIFT = 'BDB330/column-type-drift'

describe('isDisabled', () => {
  it('matches on the code only', () => {
    expect(isDisabled('BDB001', [{ code: 'BDB001', reason: 'r' }])).toBe(true)
    expect(isDisabled('BDB002', [{ code: 'BDB001', reason: 'r' }])).toBe(false)
  })
  it('narrows an entry with a subject to that subject', () => {
    const entry = {
      code: DRIFT,
      reason: 'r',
      subject: 'membership.scope_type',
    }
    expect(isDisabled(DRIFT, [entry], 'membership.scope_type')).toBe(true)
    expect(isDisabled(DRIFT, [entry], 'membership.role')).toBe(false)
    expect(isDisabled(DRIFT, [entry])).toBe(false)
  })
  it('lets an entry without a subject cover every subject', () => {
    expect(
      isDisabled(
        DRIFT,
        [{ code: DRIFT, reason: 'r' }],
        'membership.scope_type',
      ),
    ).toBe(true)
  })
})
