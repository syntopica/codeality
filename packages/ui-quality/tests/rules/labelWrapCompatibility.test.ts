import { labelWrap } from '@/rules/labelWrap.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { describe, expect, it } from 'vitest'

describe('label-wrap compatibility', () => {
  it('preserves the width-only finding without first-line metadata', () => {
    const label = elementBox({
      id: 1,
      parent: 0,
      tag: 'dt',
      text: 'Account status',
      lines: 2,
      textRight: 80,
    })
    const value = elementBox({
      id: 2,
      parent: 0,
      tag: 'dd',
      x: 100,
      width: 400,
      text: 'Ready',
      textLeft: 100,
      textRight: 140,
    })
    expect(
      labelWrap(
        snapshotOf([elementBox({ id: 0 }), label, value]),
        ruleContext(),
      ),
    ).toHaveLength(1)
  })
  it('leaves a mixed own-text and descendant branch unclassified', () => {
    const boxes = [
      elementBox({ id: 0 }),
      elementBox({ id: 1, parent: 0, tag: 'dt' }),
      elementBox({ id: 2, parent: 0, tag: 'dd', width: 10 }),
      elementBox({ id: 3, parent: 1, tag: 'svg' }),
      elementBox({
        id: 4,
        parent: 1,
        text: 'Account',
        lines: 2,
        firstTextLineCenterY: 10,
      }),
      elementBox({ id: 5, parent: 4, text: 'status' }),
    ]
    expect(labelWrap(snapshotOf(boxes), ruleContext())).toEqual([])
  })
})
