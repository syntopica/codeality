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
  it('names a list by its items', () => {
    expect(unpagedFailureOf(151, false, 150, 'list')).toMatchObject({
      subject: 'main list',
      message: expect.stringContaining('renders 151 items') as string,
    })
  })
})
