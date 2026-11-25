import { describe, expect, it } from 'vitest'

import type { ElementBox } from '@/model/ElementBox.js'
import { redundantTotal } from '@/rules/redundantTotal.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const box = (
  id: number,
  parent: number | null,
  tag: string,
  extra: Partial<ElementBox> = {},
): ElementBox => elementBox({ id, parent, tag, signature: tag, ...extra })

// 0 root > 1 body > 2 summary list > 3 row > 4 label, 5 amount (0,00 €)
const body = [
  box(0, null, 'section'),
  box(1, 0, 'div'),
  box(2, 1, 'div'),
  box(3, 2, 'div'),
  box(4, 3, 'span', { text: 'Base' }),
  box(5, 3, 'span', { text: '0,00 €' }),
]

describe('redundantTotal', () => {
  it('leaves a summary in an action footer alone', () => {
    const footer = [
      box(6, 0, 'footer'),
      box(7, 6, 'div'),
      box(8, 7, 'p'),
      box(9, 8, 'span', { text: 'Total' }),
      box(10, 8, 'span', { text: '0,00 €' }),
      box(11, 7, 'button', { text: 'Save', tappable: true }),
    ]
    expect(
      redundantTotal(snapshotOf([...body, ...footer]), ruleContext()),
    ).toEqual([])
  })
  it('still flags a total under a one-item list', () => {
    const total = [
      box(6, 0, 'div'),
      box(7, 6, 'span', { text: 'Total' }),
      box(8, 6, 'span', { text: '0,00 €' }),
    ]
    expect(
      redundantTotal(snapshotOf([...body, ...total]), ruleContext()),
    ).toHaveLength(1)
  })
})
