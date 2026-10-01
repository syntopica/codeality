import { describe, expect, it } from 'vitest'

import { emptyStateFailureOf } from '@/behaviour/emptyStateFailureOf.js'

describe('emptyStateFailureOf', () => {
  it('reports an empty table with nothing new on screen', () => {
    expect(emptyStateFailureOf([], [])?.rule).toBe('empty-state-missing')
  })
  it('accepts a message shown in place of the table', () => {
    expect(emptyStateFailureOf([], ['No results'])).toBeNull()
  })
  it('accepts a message row inside the table', () => {
    expect(emptyStateFailureOf(['No results'], [])).toBeNull()
  })
})
