import { describe, expect, it } from 'vitest'

import { postgrestSectionFrom } from '@/config/postgrestSectionFrom.js'

describe('postgrestSectionFrom', () => {
  it('needs a non-empty list of roots', () => {
    expect(postgrestSectionFrom({ roots: ['src'] })).toEqual({ roots: ['src'] })
    expect(() => postgrestSectionFrom({ roots: [] })).toThrow(
      /postgrest.roots must name at least one directory/,
    )
    expect(() => postgrestSectionFrom({})).toThrow(
      /postgrest.roots must be a list of strings/,
    )
  })
})
