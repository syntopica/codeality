import { describe, expect, it } from 'vitest'

import type { ElementBox } from '@/model/ElementBox.js'
import { numericAlignment } from '@/rules/numericAlignment.js'
import { rows } from '@tests/rows.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const amounts = ['1,250.00 €', '87.50 €', '12,004.10 €', '3.00 €']

/** The rows fixture with the second column restyled, cell by cell. */
const table = (
  cell: (text: string, index: number) => { x: number; width: number },
  style: Partial<ElementBox> = {},
): ElementBox[] =>
  rows(
    amounts.map((amount, index) => [
      { x: 0, text: `Client ${String(index)}` },
      { ...cell(amount, index), text: amount },
    ]),
  ).map((box) => (box.signature === 'span.c1' ? { ...box, ...style } : box))

const messagesOf = (elements: ElementBox[]) =>
  numericAlignment(snapshotOf(elements), ruleContext()).map(
    (finding) => finding.message,
  )

describe('numericAlignment', () => {
  it('reports amounts hung from the left edge', () => {
    const [message] = messagesOf(
      table((amount) => ({ x: 200, width: amount.length * 8 })),
    )
    expect(message).toContain(
      'column 2 holds numbers, but its values are left-aligned',
    )
  })
  it('reports a full-width cell left-aligned by text-align, and proportional digits', () => {
    const [message] = messagesOf(
      table(() => ({ x: 200, width: 120 }), {
        textAlign: 'start',
        tabularDigits: false,
      }),
    )
    expect(message).toContain('left-aligned')
    expect(message).toContain('proportional')
  })
  it('accepts right-aligned tabular amounts and text columns', () => {
    expect(
      messagesOf(
        table((amount) => ({
          x: 320 - amount.length * 8,
          width: amount.length * 8,
        })),
      ),
    ).toEqual([])
    expect(
      messagesOf(table(() => ({ x: 200, width: 120 }), { textAlign: 'right' })),
    ).toEqual([])
  })
})
