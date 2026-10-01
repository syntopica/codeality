import { describe, expect, it } from 'vitest'

import { actionFailureOf } from '@/behaviour/actionFailureOf.js'

describe('actionFailureOf', () => {
  it('accepts any feedback', () => {
    expect(actionFailureOf('form', true, true)).toBeNull()
  })
  it('names a failed request the user was not told about', () => {
    expect(actionFailureOf('form', false, true)?.message).toContain('HTTP 500')
  })
  it('names a submit that does nothing at all', () => {
    expect(actionFailureOf('form', false, false)?.message).toContain(
      'no request',
    )
  })
})
