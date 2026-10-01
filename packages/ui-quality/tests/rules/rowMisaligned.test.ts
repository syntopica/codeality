import { describe, expect, it } from 'vitest'

import { rowMisaligned } from '@/rules/rowMisaligned.js'
import { rows } from '@tests/rows.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

describe('rowMisaligned', () => {
  it('reports the first column whose cells start at different x', () => {
    const table = [
      [
        { x: 16, text: 'WA' },
        { x: 40, text: 'Ana' },
        { x: 90, text: 'hola' },
      ],
      [
        { x: 16, text: 'EMAIL' },
        { x: 60, text: 'Bea' },
        { x: 110, text: 'hey' },
      ],
      [
        { x: 16, text: 'WA' },
        { x: 40, text: 'Carla' },
        { x: 100, text: 'buenas' },
      ],
    ]
    const findings = rowMisaligned(snapshotOf(rows(table)), ruleContext())
    expect(findings).toHaveLength(1)
    expect(findings[0]?.message).toContain('column 2 of 3 rows')
    expect(findings[0]?.message).toContain('x=40 to x=60')
    expect(findings[0]?.subject).toBe('ul > li > a > span.c1')
  })
  it('accepts a right-aligned column whose cells end at one x', () => {
    const table = [
      { x: 160, width: 40 },
      { x: 120, width: 80 },
      { x: 140, width: 60 },
    ].map(({ x, width }) => [
      { x: 16, text: 'Ana' },
      { x, width, text: 'ana@example.com' },
    ])
    expect(rowMisaligned(snapshotOf(rows(table)), ruleContext())).toEqual([])
  })
  it('ignores siblings laid side by side, such as a row of icons', () => {
    const table = [
      [
        { x: 16, text: 'a' },
        { x: 40, text: 'b' },
      ],
      [
        { x: 16, text: 'a' },
        { x: 60, text: 'b' },
      ],
      [
        { x: 16, text: 'a' },
        { x: 50, text: 'b' },
      ],
    ]
    const flat = rows(table).map((element) =>
      element.tag === 'li' || element.tag === 'a' || element.tag === 'span'
        ? { ...element, y: 0 }
        : element,
    )
    expect(rowMisaligned(snapshotOf(flat), ruleContext())).toEqual([])
  })
  it('accepts aligned columns and groups shorter than minRows', () => {
    const aligned = [0, 1, 2].map(() => [
      { x: 16, text: 'WA' },
      { x: 80, text: 'Ana' },
    ])
    expect(rowMisaligned(snapshotOf(rows(aligned)), ruleContext())).toEqual([])
    const two = [
      [
        { x: 16, text: 'WA' },
        { x: 40, text: 'Ana' },
      ],
      [
        { x: 16, text: 'EMAIL' },
        { x: 60, text: 'Bea' },
      ],
    ]
    expect(rowMisaligned(snapshotOf(rows(two)), ruleContext())).toEqual([])
  })
  it('ignores chips in a wrapping flex container', () => {
    const table = [
      [
        { x: 16, text: 'alpha' },
        { x: 60, text: 'x' },
      ],
      [
        { x: 16, text: 'bravo charlie' },
        { x: 110, text: 'x' },
      ],
      [
        { x: 16, text: 'delta' },
        { x: 64, text: 'x' },
      ],
    ]
    const wrapped = rows(table).map((element) =>
      element.tag === 'ul' ? { ...element, flexWrap: 'wrap' } : element,
    )
    expect(rowMisaligned(snapshotOf(wrapped), ruleContext())).toEqual([])
  })
  it('ignores links set in running text, whose x follows the words before them', () => {
    const table = [
      [
        { x: 16, text: 'a' },
        { x: 60, text: 'source' },
      ],
      [
        { x: 16, text: 'b' },
        { x: 110, text: 'source' },
      ],
      [
        { x: 16, text: 'c' },
        { x: 64, text: 'source' },
      ],
    ]
    const prose = rows(table).map((element) =>
      element.tag === 'a'
        ? { ...element, text: 'See', textLength: 3 }
        : element,
    )
    expect(rowMisaligned(snapshotOf(prose), ruleContext())).toEqual([])
    expect(rowMisaligned(snapshotOf(rows(table)), ruleContext())).toHaveLength(
      1,
    )
  })
})
