import { describe, expect, it } from 'vitest'

import { isLineClamped } from '@/rules/isLineClamped.js'
import { visibleCharsOf } from '@/rules/visibleCharsOf.js'
import { elementBox } from '@tests/elementBox.js'

describe('line-clamp snapshot compatibility', () => {
  it('leaves legacy snapshots without clamp metadata on their existing width estimate', () => {
    const legacy = elementBox({
      id: 0,
      textLength: 40,
      clientWidth: 100,
      scrollWidth: 100,
      lines: 5,
      clientHeight: 24,
      scrollHeight: 120,
      overflowY: 'hidden',
    })
    delete legacy.lineClamp
    expect(isLineClamped(legacy)).toBe(false)
    expect(visibleCharsOf(legacy)).toBe(40)
  })
  it('retains horizontal ellipsis estimates without clamp metadata', () => {
    const legacy = elementBox({
      id: 0,
      textLength: 40,
      clientWidth: 100,
      scrollWidth: 400,
      textOverflow: 'ellipsis',
    })
    delete legacy.lineClamp
    expect(visibleCharsOf(legacy)).toBe(10)
  })
})
