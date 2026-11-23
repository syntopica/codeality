import { describe, expect, it } from 'vitest'

import { crampedSelectCaret } from '@/rules/crampedSelectCaret.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const select = (nativeCaret: boolean | undefined, paddingLeft: number) =>
  elementBox({
    id: 0,
    tag: 'select',
    padding: [0, paddingLeft, 0, paddingLeft],
    ...(nativeCaret === undefined ? {} : { nativeCaret }),
  })

describe('crampedSelectCaret', () => {
  it('reports a native select whose text is inset past its caret', () => {
    expect(
      crampedSelectCaret(snapshotOf([select(true, 12)]), ruleContext())[0]
        ?.message,
    ).toContain('insets its text 12px')
  })
  it('accepts an unpadded native select, a drawn chevron and an older snapshot', () => {
    for (const [nativeCaret, paddingLeft] of [
      [true, 0],
      [true, 4],
      [false, 12],
      [undefined, 12],
    ] as const)
      expect(
        crampedSelectCaret(
          snapshotOf([select(nativeCaret, paddingLeft)]),
          ruleContext(),
        ),
      ).toEqual([])
  })
})
