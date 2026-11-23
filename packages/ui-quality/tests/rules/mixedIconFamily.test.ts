import { describe, expect, it } from 'vitest'

import { mixedIconFamily } from '@/rules/mixedIconFamily.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const grid = elementBox({ id: 0 })
const cards = (side: number) => [
  grid,
  elementBox({ id: 1, parent: 0 }),
  elementBox({ id: 2, parent: 0 }),
  elementBox({
    id: 3,
    parent: 1,
    tag: 'svg',
    width: side,
    height: side,
    svgDigest: 'a',
    svgPaint: 'fill',
  }),
  elementBox({
    id: 4,
    parent: 2,
    tag: 'svg',
    width: side,
    height: side,
    svgDigest: 'b',
    svgPaint: 'stroke',
  }),
]

describe('mixedIconFamily', () => {
  it('reports sibling items whose glyphs are filled and outlined', () => {
    expect(
      mixedIconFamily(snapshotOf(cards(24)), ruleContext()).map(
        (finding) => finding.subject,
      ),
    ).toEqual(['#e0'])
  })
  it('leaves chart-sized drawings alone: a pie beside an area chart is not an icon set', () => {
    expect(mixedIconFamily(snapshotOf(cards(320)), ruleContext())).toEqual([])
  })
})
