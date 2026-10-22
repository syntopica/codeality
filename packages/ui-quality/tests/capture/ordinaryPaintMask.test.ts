import { describe, expect, it } from 'vitest'

import { ordinaryPaintMaskResult } from './ordinaryPaintMaskResult.js'

describe.each(['mask-border-source', '-webkit-mask-box-image-source'])(
  'independent %s paint admission',
  (property) => {
    it.each([
      ['', true],
      ['none', true],
      ['linear-gradient(black,transparent)', false],
      ['url("synthetic-mask")', false],
    ] as const)('keeps conservative admission for %s', (value, expected) => {
      expect(ordinaryPaintMaskResult({ [property]: value })).toBe(expected)
    })
  },
)
