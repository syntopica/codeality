import { describe, expect, it } from 'vitest'

import { cardRadiusAdmin } from '@/rules/cardRadiusAdmin.js'
import { radiusSprawl } from '@/rules/radiusSprawl.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const main = elementBox({ id: 0, tag: 'main', isMain: true, selector: 'main' })
const rounded = (id: number, radius: number, overrides = {}) =>
  elementBox({
    id,
    parent: 0,
    width: 200,
    height: 80,
    borderRadius: radius,
    signature: `div.r${String(id)}`,
    ...overrides,
  })

describe('radiusSprawl', () => {
  it('reports five distinct radii and ignores pills, circles and radii outside main', () => {
    const outside = elementBox({ id: 7, borderRadius: 30, height: 100 })
    const findings = radiusSprawl(
      snapshotOf([
        main,
        rounded(1, 2),
        rounded(2, 4),
        rounded(3, 6),
        rounded(4, 8),
        rounded(5, 12),
        rounded(6, 40),
        outside,
      ]),
      ruleContext(),
    )
    expect(findings).toHaveLength(1)
    expect(findings[0]?.message).toContain('5 corner radii (2, 4, 6, 8, 12px)')
  })
  it('accepts four radii', () => {
    expect(
      radiusSprawl(
        snapshotOf([
          main,
          rounded(1, 2),
          rounded(2, 4),
          rounded(3, 8),
          rounded(4, 12),
          rounded(5, 3.6),
        ]),
        ruleContext(),
      ),
    ).toEqual([])
  })
})

describe('cardRadiusAdmin', () => {
  const card = rounded(1, 16, {
    padding: [16, 16, 16, 16],
    height: 120,
    borderWidths: [1, 1, 1, 1],
    borderColors: Array.from({ length: 4 }, () => [209, 213, 219, 1]),
    selector: 'section.card',
  })
  const roots = [
    {
      color: [255, 255, 255, 1] as [number, number, number, number],
      hasImage: false,
    },
  ]
  it('is off unless the project says it is a product UI', () => {
    expect(
      cardRadiusAdmin(
        snapshotOf([main, card], { rootBackgrounds: roots }),
        ruleContext(),
      ),
    ).toEqual([])
  })
  it('reports a card over 8px and keeps an 8px one', () => {
    const findings = cardRadiusAdmin(
      snapshotOf(
        [
          main,
          card,
          { ...card, id: 2, borderRadius: 8, selector: 'section.ok' },
        ],
        {
          rootBackgrounds: roots,
        },
      ),
      ruleContext({ register: 'product' }),
    )
    expect(findings.map((finding) => finding.subject)).toEqual(['section.card'])
  })
})
