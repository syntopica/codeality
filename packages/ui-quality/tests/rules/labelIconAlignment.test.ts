import { labelIconIsMisaligned } from '@/rules/labelIconIsMisaligned.js'
import { elementBox } from '@tests/elementBox.js'
import { describe, expect, it } from 'vitest'

describe('label SVG viewport alignment tolerance', () => {
  it.each([
    { offset: -4, expected: true },
    { offset: -2, expected: false },
    { offset: 0, expected: false },
    { offset: 2, expected: false },
    { offset: 4, expected: true },
  ])('compares a signed $offset px offset', ({ offset, expected }) => {
    expect(
      labelIconIsMisaligned({
        icon: elementBox({
          id: 0,
          x: 0,
          y: 100 + offset,
          width: 16,
          height: 16,
        }),
        text: elementBox({
          id: 1,
          x: 24,
          y: 90,
          height: 70,
          firstTextLineCenterY: 108,
        }),
      }),
    ).toBe(expected)
  })
  it.each([null, undefined, Number.NaN])(
    'ignores unavailable centre %s',
    (centre) => {
      const text = elementBox({
        id: 1,
        x: 24,
        firstTextLineCenterY: centre ?? null,
      })
      if (centre === undefined) delete text.firstTextLineCenterY
      expect(
        labelIconIsMisaligned({
          icon: elementBox({ id: 0, width: 16, height: 16 }),
          text,
        }),
      ).toBe(false)
    },
  )
})
