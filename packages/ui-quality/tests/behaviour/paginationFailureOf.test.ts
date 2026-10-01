import { describe, expect, it } from 'vitest'

import { paginationFailureOf } from '@/behaviour/paginationFailureOf.js'

describe('paginationFailureOf', () => {
  it('reports a next page that shows the same rows', () => {
    expect(paginationFailureOf(['a', 'b'], ['a', 'b'], null)?.subject).toBe(
      'next page',
    )
  })
  it('reports a previous page that does not return to the first', () => {
    expect(paginationFailureOf(['a'], ['b'], ['b'])?.subject).toBe(
      'previous page',
    )
  })
  it('accepts a pager that moves forward and back', () => {
    expect(paginationFailureOf(['a'], ['b'], ['a'])).toBeNull()
  })
})
