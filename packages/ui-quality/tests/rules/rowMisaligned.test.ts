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
})
