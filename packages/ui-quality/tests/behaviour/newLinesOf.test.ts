import { describe, expect, it } from 'vitest'

import { newLinesOf } from '@/behaviour/newLinesOf.js'

describe('newLinesOf', () => {
  it('keeps only lines that appeared, minus what was typed', () => {
    expect(newLinesOf(['a'], ['a', 'zz', 'No results'], 'zz')).toEqual([
      'No results',
    ])
  })
})
