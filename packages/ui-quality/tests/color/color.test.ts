import { describe, expect, it } from 'vitest'

import { deltaE } from '@/color/deltaE.js'
import { hexToRgba } from '@/color/hexToRgba.js'
import { rgbaToHex } from '@/color/rgbaToHex.js'
import { rgbaToLab } from '@/color/rgbaToLab.js'

describe('colour helpers', () => {
  it('round-trips hex, short and long', () => {
    expect(hexToRgba('#f027a5')).toEqual([240, 39, 165, 1])
    expect(hexToRgba('#fff')).toEqual([255, 255, 255, 1])
    expect(rgbaToHex([240, 39, 165, 1])).toBe('#f027a5')
  })
  it('measures black against white as about 100 and a colour against itself as 0', () => {
    expect(
      deltaE(rgbaToLab([0, 0, 0, 1]), rgbaToLab([255, 255, 255, 1])),
    ).toBeCloseTo(100, 0)
    expect(deltaE(rgbaToLab([1, 2, 3, 1]), rgbaToLab([1, 2, 3, 1]))).toBe(0)
  })
})
