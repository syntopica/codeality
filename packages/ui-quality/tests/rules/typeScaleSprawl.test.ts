import { describe, expect, it } from 'vitest'

import { typeScaleSprawl } from '@/rules/typeScaleSprawl.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { subjectsOf } from '@tests/subjectsOf.js'

describe('typeScaleSprawl', () => {
  const main = elementBox({ id: 0, isMain: true, selector: 'main' })
  const text = (id: number, fontSize: number, parent = 0) =>
    elementBox({ id, parent, fontSize, text: `Label ${String(id)}` })
  it('reports more than six sizes in the main region', () => {
    const [finding] = typeScaleSprawl(
      snapshotOf([
        main,
        ...[12, 14, 16, 18, 20, 24, 32].map((size, i) => text(i + 1, size)),
      ]),
      ruleContext(),
    )
    expect(finding?.subject).toBe('main')
    expect(finding?.message).toContain('7 font sizes')
  })
  it('reports two sizes 1px apart side by side, under their parent', () => {
    const row = elementBox({ id: 1, parent: 0, selector: 'div.meta' })
    expect(
      subjectsOf(typeScaleSprawl, [main, row, text(2, 14, 1), text(3, 13, 1)]),
    ).toEqual(['div.meta'])
  })
  it('leaves authored content, code, outside text and a tidy scale alone', () => {
    const article = elementBox({ id: 1, parent: 0, tag: 'article' })
    const prose = elementBox({ id: 2, parent: 0, signature: 'div.prose' })
    const code = elementBox({ id: 3, parent: 0, tag: 'code', text: 'x' })
    expect(
      subjectsOf(typeScaleSprawl, [
        main,
        article,
        prose,
        code,
        text(4, 14, 1),
        text(5, 13, 1),
        text(6, 15, 2),
        text(7, 16, 2),
        text(8, 13, 3),
        text(9, 14),
        text(10, 16),
        elementBox({ id: 11, fontSize: 15, text: 'outside' }),
      ]),
    ).toEqual([])
  })
  it('needs a main region', () => {
    expect(
      subjectsOf(typeScaleSprawl, [elementBox({ id: 0 }), text(1, 13)]),
    ).toEqual([])
  })
})
