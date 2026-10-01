import { describe, expect, it } from 'vitest'

import { columnOrderOf } from '@/behaviour/columnOrderOf.js'

describe('columnOrderOf', () => {
  it('tells rising, falling, unordered and flat columns apart', () => {
    expect(columnOrderOf([1, 2, null, 2, 5])).toBe('asc')
    expect(columnOrderOf([20260919, 20260917, 20260905])).toBe('desc')
    expect(columnOrderOf(['Ángel', 'beta', 'Zeta'])).toBe('asc')
    expect(columnOrderOf(['F2', 'F10', 'F11'])).toBe('asc')
    expect(columnOrderOf([3, 1, 2])).toBe('none')
    expect(columnOrderOf([7, null, 7])).toBe('flat')
  })
})
