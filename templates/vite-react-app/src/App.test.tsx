import { describe, expect, it } from 'vitest'

import { add } from './lib/add'

// Smoke test: verifies the test pipeline runs end-to-end.
// For component rendering tests, install @testing-library/react and add a setup file.
describe('add', () => {
  it('adds two numbers', () => {
    expect(add(1, 2)).toBe(3)
  })
})
