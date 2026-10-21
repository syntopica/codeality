import { describe, expect, it } from 'vitest'

import { listDanglingRule } from '@/rules/listDanglingRule.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

describe('listDanglingRule scrolling ancestors', () => {
  it.each([
    {
      name: 'auto ancestor',
      overflow: 'auto',
      scrollHeight: 1000,
      innerCard: false,
      expected: 0,
    },
    {
      name: 'scroll ancestor',
      overflow: 'scroll',
      scrollHeight: 1000,
      innerCard: false,
      expected: 0,
    },
    {
      name: 'ordinary frame',
      overflow: 'visible',
      scrollHeight: 120,
      innerCard: false,
      expected: 1,
    },
    {
      name: 'auto without overflowing content',
      overflow: 'auto',
      scrollHeight: 120,
      innerCard: false,
      expected: 1,
    },
    {
      name: 'distinct card before outer scroll boundary',
      overflow: 'auto',
      scrollHeight: 1000,
      innerCard: true,
      expected: 1,
    },
  ])('$name', ({ overflow, scrollHeight, innerCard, expected }) => {
    const frame = elementBox({
      id: 0,
      width: 400,
      height: 120,
      clientHeight: 120,
      scrollHeight,
      overflowY: overflow,
      borderRadius: 8,
    })
    const wrapper = elementBox({
      id: 1,
      parent: 0,
      width: 400,
      height: innerCard ? 120 : scrollHeight,
      borderRadius: innerCard ? 8 : 0,
    })
    const spacer = elementBox({
      id: 2,
      parent: 1,
      width: 400,
      height: innerCard ? 120 : scrollHeight,
      position: 'relative',
    })
    const rows = [0, 1, 2].map((index) =>
      elementBox({
        id: index + 3,
        parent: 2,
        signature: 'div.absolute.left-0',
        selector: `#row${String(index)}`,
        position: 'absolute',
        width: 400,
        height: 40,
        y: (scrollHeight > 120 && !innerCard ? 20 : 0) + index * 40,
        text: 'Synthetic row',
        borderWidths: [0, 0, 1, 0],
        borderColors: [null, null, [100, 100, 100, 1], null],
      }),
    )
    const findings = listDanglingRule(
      snapshotOf([frame, wrapper, spacer, ...rows]),
      ruleContext(),
    )
    expect(findings.map((finding) => finding.subject)).toEqual(
      expected ? ['#row2'] : [],
    )
  })

  it.each(['table', 'footer', 'direct scroll', 'between-item dividers'])(
    'retains the %s control',
    (control) => {
      const frame = elementBox({
        id: 0,
        width: 400,
        height: 200,
        borderRadius: 8,
      })
      const list = elementBox({
        id: 1,
        parent: 0,
        width: 400,
        height: 120,
        overflowY: control === 'direct scroll' ? 'auto' : 'visible',
        clientHeight: 80,
        scrollHeight: 120,
      })
      const rows = [0, 1, 2].map((index) =>
        elementBox({
          id: index + 2,
          parent: 1,
          signature: 'row',
          tag: control === 'table' ? 'tr' : 'div',
          width: 400,
          height: 40,
          y: index * 40,
          text: 'Synthetic row',
          borderWidths:
            control === 'between-item dividers'
              ? [index > 0 ? 1 : 0, 0, 0, 0]
              : [0, 0, 1, 0],
          borderColors: [[100, 100, 100, 1], null, [100, 100, 100, 1], null],
        }),
      )
      const footer = elementBox({ id: 5, parent: 0, y: 120, text: 'Total' })
      expect(
        listDanglingRule(
          snapshotOf([
            frame,
            list,
            ...rows,
            ...(control === 'footer' ? [footer] : []),
          ]),
          ruleContext(),
        ),
      ).toEqual([])
    },
  )
})
