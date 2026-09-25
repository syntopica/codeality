import { describe, expect, it } from 'vitest'

import { median } from '@/bench/median.js'

describe('median', () => {
  it('takes the middle element of an odd-length list', () => {
    expect(median([3, 1, 2])).toBe(2)
  })
  it('averages the two middle elements of an even-length list', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5)
  })
})
