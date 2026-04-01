import { describe, expect, it } from 'vitest'

import { add } from './add'

describe('add', () => {
  it('adds two numbers', () => {
    expect(add(2, 3)).toBe(5)
  })
})
