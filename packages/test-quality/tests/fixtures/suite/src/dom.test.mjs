import { expect, it } from 'vitest'

it.skipIf(typeof window === 'undefined')('has a window', () => {
  expect(typeof window).toBe('object')
})
