import { describe, expect, it } from 'vitest'

import { add } from './index'

describe('add', () => {
  it('adds two numbers', () => {
    expect(add(3, 4)).toBe(7)
  })
})
