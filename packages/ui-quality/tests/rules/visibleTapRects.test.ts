import { visibleTapRects } from '@/rules/visibleTapRects.js'
import { elementBox } from '@tests/elementBox.js'
import { describe, expect, it } from 'vitest'

describe('visibleTapRects', () => {
  it('retains all four exposed fragments instead of their enclosing box', () => {
    expect(
      visibleTapRects(
        elementBox({
          id: 0,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          tapOcclusion: { x: 20, y: 20, width: 60, height: 60 },
        }),
      ),
    ).toEqual([
      { x: 0, y: 0, width: 100, height: 20 },
      { x: 0, y: 80, width: 100, height: 20 },
      { x: 0, y: 20, width: 20, height: 60 },
      { x: 80, y: 20, width: 20, height: 60 },
    ])
  })
  it.each([NaN, Infinity, -1, 0])(
    'preserves the original box when coverage width is unknown: %s',
    (width) => {
      const target = elementBox({
        id: 0,
        tapOcclusion: { x: 0, y: 0, width, height: 100 },
      })
      expect(visibleTapRects(target)).toEqual([target])
    },
  )
  it('retains legacy and disjoint boxes, and removes full confirmed coverage', () => {
    const target = elementBox({ id: 0, width: 48, height: 48 })
    expect(visibleTapRects(target)).toEqual([target])
    expect(
      visibleTapRects({
        ...target,
        tapOcclusion: { x: 100, y: 100, width: 48, height: 48 },
      }),
    ).toEqual([
      { ...target, tapOcclusion: { x: 100, y: 100, width: 48, height: 48 } },
    ])
    expect(
      visibleTapRects({
        ...target,
        tapOcclusion: { x: 0, y: 0, width: 48, height: 48 },
      }),
    ).toEqual([])
  })
})
