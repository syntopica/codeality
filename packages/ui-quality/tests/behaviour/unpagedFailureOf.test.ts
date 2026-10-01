import { describe, expect, it } from 'vitest'

import { unpagedFailureOf } from '@/behaviour/unpagedFailureOf.js'

describe('unpagedFailureOf', () => {
  it('reports a long table with no pager', () => {
    expect(unpagedFailureOf(301, false, 300)?.rule).toBe('pagination-missing')
  })
  it('accepts a long table that has a pager on its last page', () => {
    expect(unpagedFailureOf(301, true, 300)).toBeNull()
  })
  it('accepts a short table with no pager', () => {
    expect(unpagedFailureOf(300, false, 300)).toBeNull()
  })
})
